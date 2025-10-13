# fastapi_app_db.py - FastAPI server using real database data

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import pandas as pd
import numpy as np
from ml_recommender_db import DatabaseMLRecommender
import os

# Initialize FastAPI app
app = FastAPI(
    title="Database ML Recommendation System API",
    description="API for ML-based campaign recommendations using real database data",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global recommender instance
recommender = None

# Pydantic models for API requests/responses
class RecommendationRequest(BaseModel):
    donor_id: str
    top_k: int = 5

class SimilarDonorsRequest(BaseModel):
    donor_id: str
    n_neighbors: int = 5

class RecommendationResponse(BaseModel):
    campaign_id: str
    title: str
    category: str
    predicted_score: float
    confidence: float

class SimilarDonorResponse(BaseModel):
    donor_id: str
    name: str
    bio: str
    isVerified: bool
    similarity_score: float

class SystemStatusResponse(BaseModel):
    status: str
    message: str
    donor_count: int
    campaign_count: int
    model_components: int
    data_source: str

@app.on_event("startup")
async def startup_event():
    """Initialize the ML recommender on startup using database data"""
    global recommender
    try:
        print("🚀 Initializing Database ML Recommendation System...")
        
        # Get backend URL from environment or use default
        backend_url = os.getenv('BACKEND_API_URL', 'http://localhost:5050/api')
        print(f"📡 Backend API URL: {backend_url}")
        
        recommender = DatabaseMLRecommender(n_components=10, backend_url=backend_url)
        
        if recommender.load_data_from_backend():
            recommender.create_interaction_matrix(sparsity=0.7)
            recommender.fit_nmf()
            print("✅ Database ML Recommendation System initialized successfully!")
        else:
            print("❌ Failed to initialize Database ML Recommendation System")
            recommender = None
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
        recommender = None

@app.get("/", response_model=dict)
async def root():
    """Root endpoint with system information"""
    return {
        "message": "Database ML Recommendation System API",
        "version": "1.0.0",
        "data_source": "PostgreSQL Database via Backend API",
        "endpoints": {
            "status": "/status",
            "recommendations": "/recommendations",
            "similar_donors": "/similar-donors",
            "donors": "/donors",
            "campaigns": "/campaigns"
        }
    }

@app.get("/status", response_model=SystemStatusResponse)
async def get_system_status():
    """Get system status and statistics"""
    if recommender is None:
        raise HTTPException(status_code=503, detail="ML recommender not initialized")
    
    return SystemStatusResponse(
        status="ready",
        message="Database ML recommendation system is operational",
        donor_count=len(recommender.donor_df) if recommender.donor_df is not None else 0,
        campaign_count=len(recommender.campaign_df) if recommender.campaign_df is not None else 0,
        model_components=recommender.nmf_model.n_components_ if recommender.nmf_model is not None else 0,
        data_source="PostgreSQL Database"
    )

@app.post("/recommendations", response_model=List[RecommendationResponse])
async def get_recommendations(request: RecommendationRequest):
    """Get campaign recommendations for a donor using database data"""
    if recommender is None:
        raise HTTPException(status_code=503, detail="ML recommender not initialized")
    
    try:
        recommendations_df = recommender.get_recommendations(
            request.donor_id, 
            top_k=request.top_k
        )
        
        if recommendations_df.empty:
            return []
        
        recommendations = []
        for _, row in recommendations_df.iterrows():
            recommendations.append(RecommendationResponse(
                campaign_id=row['campaign_id'],
                title=row['title'],
                category=row['category'],
                predicted_score=float(row['predicted_score']),
                confidence=float(row['confidence'])
            ))
        
        return recommendations
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}")

@app.post("/similar-donors", response_model=List[SimilarDonorResponse])
async def get_similar_donors(request: SimilarDonorsRequest):
    """Get similar donors for a given donor using database data"""
    if recommender is None:
        raise HTTPException(status_code=503, detail="ML recommender not initialized")
    
    try:
        similar_donors_df = recommender.get_similar_donors(
            request.donor_id, 
            n_neighbors=request.n_neighbors
        )
        
        if similar_donors_df.empty:
            return []
        
        similar_donors = []
        for _, row in similar_donors_df.iterrows():
            similar_donors.append(SimilarDonorResponse(
                donor_id=row['donor_id'],
                name=row['name'],
                bio=row['bio'],
                isVerified=bool(row['isVerified']),
                similarity_score=float(row['similarity_score'])
            ))
        
        return similar_donors
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting similar donors: {str(e)}")

@app.get("/donors")
async def get_donors():
    """Get all donors from database"""
    if recommender is None or recommender.donor_df is None:
        raise HTTPException(status_code=503, detail="ML recommender not initialized")
    
    donors = []
    for _, row in recommender.donor_df.iterrows():
        donors.append({
            "id": row['id'],
            "walletAddress": row['walletAddress'],
            "email": row['email'],
            "name": row['name'],
            "bio": row['bio'],
            "isVerified": bool(row['isVerified']),
            "role": row['role'],
            "status": row['status'],
            "createdAt": row['createdAt'],
            "updatedAt": row['updatedAt']
        })
    
    return {"donors": donors, "count": len(donors), "data_source": "PostgreSQL Database"}

@app.get("/campaigns")
async def get_campaigns():
    """Get all campaigns from database"""
    if recommender is None or recommender.campaign_df is None:
        raise HTTPException(status_code=503, detail="ML recommender not initialized")
    
    try:
        campaigns = []
        for _, row in recommender.campaign_df.iterrows():
            def safe(val, default):
                if pd.isna(val) or (isinstance(val, float) and np.isnan(val)):
                    return default
                return val
            
            campaigns.append({
                "id": safe(row.get('id', ''), ''),
                "title": safe(row.get('title', ''), ''),
                "description": safe(row.get('description', ''), ''),
                "story": safe(row.get('story', ''), ''),
                "additionalMedia": safe(row.get('additionalMedia', ''), ''),
                "imageUrl": safe(row.get('imageUrl', ''), ''),
                "targetAmount": safe(row.get('targetAmount', 0), 0),
                "currentAmount": safe(row.get('currentAmount', 0), 0),
                "escrowAmount": safe(row.get('escrowAmount', 0), 0),
                "releasedAmount": safe(row.get('releasedAmount', 0), 0),
                "category": safe(row.get('category', ''), ''),
                "status": safe(row.get('status', ''), ''),
                "riskScore": safe(row.get('riskScore', 0), 0),
                "isFraudulent": safe(row.get('isFraudulent', False), False),
                "requiresMilestones": safe(row.get('requiresMilestones', False), False),
                "startDate": safe(row.get('startDate', ''), ''),
                "endDate": safe(row.get('endDate', ''), ''),
                "createdAt": safe(row.get('createdAt', ''), ''),
                "updatedAt": safe(row.get('updatedAt', ''), '')
            })
        
        return {"campaigns": campaigns, "count": len(campaigns), "data_source": "PostgreSQL Database"}
        
    except Exception as e:
        print(f"/campaigns endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"/campaigns error: {e}")

@app.get("/debug-campaigns")
async def debug_campaigns():
    """Debug endpoint to see campaign categories and content"""
    if recommender is None:
        raise HTTPException(status_code=503, detail="ML recommender not initialized")
    
    try:
        campaigns_info = []
        categories = set()
        
        for _, campaign in recommender.campaign_df.iterrows():
            categories.add(campaign.get('category', 'Unknown'))
            campaigns_info.append({
                'id': campaign['id'],
                'title': campaign['title'],
                'category': campaign.get('category', 'Unknown'),
                'description': campaign.get('description', '')[:100] + '...' if len(campaign.get('description', '')) > 100 else campaign.get('description', ''),
                'targetAmount': campaign.get('targetAmount', 0),
                'currentAmount': campaign.get('currentAmount', 0)
            })
        
        return {
            "total_campaigns": len(campaigns_info),
            "unique_categories": list(categories),
            "category_count": len(categories),
            "campaigns": campaigns_info
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error debugging campaigns: {str(e)}")

@app.get("/debug-user-recommendations")
async def debug_user_recommendations():
    """Debug endpoint to test recommendations for all users"""
    if recommender is None:
        raise HTTPException(status_code=503, detail="ML recommender not initialized")
    
    try:
        results = {}
        
        for _, donor in recommender.donor_df.iterrows():
            donor_id = donor['id']
            donor_name = donor['name']
            donor_bio = donor['bio']
            
            # Get recommendations for this donor
            recommendations_df = recommender.get_recommendations(donor_id, top_k=5)
            
            if not recommendations_df.empty:
                recommendations = []
                for _, row in recommendations_df.iterrows():
                    recommendations.append({
                        'campaign_id': row['campaign_id'],
                        'title': row['title'],
                        'category': row['category'],
                        'predicted_score': float(row['predicted_score']),
                        'confidence': float(row['confidence'])
                    })
                
                # Get unique categories
                categories = list(set(rec['category'] for rec in recommendations))
                
                results[donor_name] = {
                    'donor_id': donor_id,
                    'bio': donor_bio,
                    'recommendations': recommendations,
                    'categories': categories,
                    'top_category': categories[0] if categories else 'None',
                    'recommendation_count': len(recommendations)
                }
            else:
                results[donor_name] = {
                    'donor_id': donor_id,
                    'bio': donor_bio,
                    'recommendations': [],
                    'categories': [],
                    'top_category': 'None',
                    'recommendation_count': 0
                }
        
        return {
            "user_recommendations": results,
            "summary": {
                "total_users": len(results),
                "unique_top_categories": len(set(result['top_category'] for result in results.values())),
                "all_categories": list(set(cat for result in results.values() for cat in result['categories']))
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error debugging recommendations: {str(e)}")

@app.get("/test")
async def test_recommendations():
    """Test endpoint to get recommendations for the first donor using database data"""
    if recommender is None:
        raise HTTPException(status_code=503, detail="ML recommender not initialized")
    
    try:
        if len(recommender.donor_df) == 0:
            return {"error": "No donors found in database"}
        
        # Get the first donor
        first_donor_id = recommender.donor_df['id'].iloc[0]
        
        # Get recommendations
        recommendations_df = recommender.get_recommendations(first_donor_id, top_k=3)
        
        # Get similar donors
        similar_donors_df = recommender.get_similar_donors(first_donor_id, n_neighbors=2)
        
        return {
            "test_donor": {
                "id": first_donor_id,
                "name": recommender.donor_df.iloc[0]['name'],
                "bio": recommender.donor_df.iloc[0]['bio']
            },
            "recommendations": recommendations_df.to_dict('records') if not recommendations_df.empty else [],
            "similar_donors": similar_donors_df.to_dict('records') if not similar_donors_df.empty else [],
            "data_source": "PostgreSQL Database"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")

@app.post("/refresh")
async def refresh_data():
    """Refresh data from database and retrain model"""
    global recommender
    try:
        print("🔄 Refreshing data from database...")
        
        if recommender is None:
            recommender = DatabaseMLRecommender(n_components=10)
        
        if recommender.load_data_from_backend():
            recommender.create_interaction_matrix(sparsity=0.7)
            recommender.fit_nmf()
            print("✅ Data refreshed and model retrained successfully!")
            return {"message": "Data refreshed successfully", "status": "success"}
        else:
            return {"message": "Failed to refresh data", "status": "error"}
            
    except Exception as e:
        print(f"❌ Error refreshing data: {e}")
        return {"message": f"Error refreshing data: {str(e)}", "status": "error"}

@app.get("/debug-model")
async def debug_model():
    """Debug endpoint to check interaction matrix and NMF model"""
    if recommender is None:
        raise HTTPException(status_code=503, detail="ML recommender not initialized")
    
    try:
        # Check interaction matrix
        interaction_matrix = recommender.user_item_matrix
        non_zero_count = np.count_nonzero(interaction_matrix)
        sparsity = (interaction_matrix == 0).sum() / interaction_matrix.size
        
        # Check NMF model
        nmf_components = recommender.nmf_model.n_components_ if recommender.nmf_model else 0
        nmf_iterations = recommender.nmf_model.n_iter_ if recommender.nmf_model else 0
        
        # Test NMF predictions
        test_predictions = []
        if recommender.nmf_model and len(recommender.donor_df) > 0:
            donor_idx = 0
            donor_latent = recommender.nmf_model.components_.T[donor_idx]
            campaign_latent = recommender.nmf_model.components_
            predicted_scores = np.dot(donor_latent, campaign_latent)
            test_predictions = predicted_scores.tolist()
        
        return {
            "interaction_matrix": {
                "shape": interaction_matrix.shape,
                "non_zero_count": int(non_zero_count),
                "sparsity": float(sparsity),
                "min_value": float(np.min(interaction_matrix)),
                "max_value": float(np.max(interaction_matrix)),
                "mean_value": float(np.mean(interaction_matrix))
            },
            "nmf_model": {
                "components": nmf_components,
                "iterations": nmf_iterations,
                "test_predictions": test_predictions[:5] if test_predictions else []
            },
            "embeddings": {
                "donor_shape": recommender.donor_embeddings.shape if recommender.donor_embeddings is not None else None,
                "campaign_shape": recommender.campaign_embeddings.shape if recommender.campaign_embeddings is not None else None
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error debugging model: {str(e)}")

@app.get("/debug-similarity")
async def debug_similarity():
    """Debug endpoint to check text content and similarity calculations"""
    if recommender is None:
        raise HTTPException(status_code=503, detail="ML recommender not initialized")
    
    try:
        results = {}
        
        for i, (_, donor) in enumerate(recommender.donor_df.iterrows()):
            donor_name = donor['name']
            donor_bio = donor['bio'] if donor['bio'] else "No bio"
            
            # Get donor embedding
            donor_emb = recommender.donor_embeddings[i]
            
            similarities = []
            for j, (_, campaign) in enumerate(recommender.campaign_df.iterrows()):
                campaign_title = campaign['title']
                campaign_category = campaign.get('category', 'Unknown')
                campaign_desc = campaign.get('description', '')[:100] + '...' if len(campaign.get('description', '')) > 100 else campaign.get('description', '')
                
                # Get campaign embedding
                campaign_emb = recommender.campaign_embeddings[j]
                
                # Calculate similarity
                try:
                    similarity = np.dot(donor_emb, campaign_emb) / (np.linalg.norm(donor_emb) * np.linalg.norm(campaign_emb))
                    if np.isnan(similarity) or np.isinf(similarity):
                        similarity = 0.0
                except:
                    similarity = 0.0
                
                similarities.append({
                    'campaign_title': campaign_title,
                    'category': campaign_category,
                    'description': campaign_desc,
                    'similarity': float(similarity)
                })
            
            # Sort by similarity
            similarities.sort(key=lambda x: x['similarity'], reverse=True)
            
            results[donor_name] = {
                'bio': donor_bio,
                'top_similarities': similarities[:3]  # Top 3 most similar
            }
        
        return {
            "similarity_analysis": results,
            "note": "This shows the raw TF-IDF similarity between user bios and campaign content"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error debugging similarity: {str(e)}")

@app.get("/debug-campaign-content")
async def debug_campaign_content():
    """Debug endpoint to see actual campaign content and understand matching issues"""
    if recommender is None:
        raise HTTPException(status_code=503, detail="ML recommender not initialized")
    
    try:
        campaigns_info = []
        
        for _, campaign in recommender.campaign_df.iterrows():
            # Get the full text content used for embeddings
            text_fields = ["title", "description"]
            full_text = " ".join([str(campaign.get(field, "")) for field in text_fields])
            
            campaigns_info.append({
                'id': campaign['id'],
                'title': campaign['title'],
                'category': campaign.get('category', 'Unknown'),
                'description': campaign.get('description', ''),
                'full_text_for_embedding': full_text[:200] + '...' if len(full_text) > 200 else full_text,
                'targetAmount': campaign.get('targetAmount', 0),
                'currentAmount': campaign.get('currentAmount', 0)
            })
        
        return {
            "campaigns": campaigns_info,
            "note": "This shows the actual text content used for TF-IDF embeddings"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error debugging campaign content: {str(e)}")

@app.get("/debug-categories")
async def debug_categories():
    """Debug endpoint to see all available campaign categories"""
    if recommender is None:
        raise HTTPException(status_code=503, detail="ML recommender not initialized")
    
    try:
        categories = {}
        
        for _, campaign in recommender.campaign_df.iterrows():
            category = campaign.get('category', 'Unknown')
            if category not in categories:
                categories[category] = []
            
            categories[category].append({
                'id': campaign['id'],
                'title': campaign['title'],
                'description': campaign.get('description', '')[:100] + '...' if len(campaign.get('description', '')) > 100 else campaign.get('description', '')
            })
        
        return {
            "available_categories": categories,
            "category_count": {cat: len(campaigns) for cat, campaigns in categories.items()},
            "total_campaigns": len(recommender.campaign_df)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error debugging categories: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Database ML Recommendation System FastAPI Server...")
    print("📊 Data Source: PostgreSQL Database via Backend API")
    print("=" * 60)
    
    uvicorn.run(
        "fastapi_app_db:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )