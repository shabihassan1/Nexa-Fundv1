# ml_recommender_db.py - Uses real database data from backend API

import numpy as np
import pandas as pd
import requests
from sklearn.decomposition import NMF
from sklearn.preprocessing import MinMaxScaler
from embed_utils_tfidf import compute_tfidf_embeddings, donor_text_fields, donor_numeric_fields, campaign_text_fields, campaign_numeric_fields
import warnings
import os
warnings.filterwarnings('ignore')

class DatabaseMLRecommender:
    def __init__(self, n_components=10, backend_url="http://localhost:5050/api"):
        self.n_components = n_components
        self.backend_url = backend_url
        self.nmf_model = None
        self.user_item_matrix = None
        self.donor_embeddings = None
        self.campaign_embeddings = None
        self.donor_df = None
        self.campaign_df = None
        self.donor_vectorizer = None
        self.campaign_vectorizer = None
        self.scaler = MinMaxScaler()
        
    def load_data_from_backend(self):
        """Load data from backend API instead of CSV files"""
        try:
            print("🔄 Fetching data from backend API...")
            
            # Add retry logic for rate limiting
            max_retries = 3
            retry_delay = 2  # seconds
            
            for attempt in range(max_retries):
                try:
                    # Fetch donors (users)
                    donors_response = requests.get(f"{self.backend_url}/recommender/export/donors")
                    if donors_response.status_code == 429:
                        if attempt < max_retries - 1:
                            print(f"⚠️  Rate limited (429), retrying in {retry_delay} seconds... (attempt {attempt + 1}/{max_retries})")
                            import time
                            time.sleep(retry_delay)
                            retry_delay *= 2  # Exponential backoff
                            continue
                        else:
                            raise Exception(f"Rate limited after {max_retries} attempts")
                    elif donors_response.status_code != 200:
                        raise Exception(f"Failed to fetch donors: {donors_response.status_code}")
                    
                    donors_data = donors_response.json()
                    self.donor_df = pd.DataFrame(donors_data['donors'])
                    
                    # Fetch campaigns
                    campaigns_response = requests.get(f"{self.backend_url}/recommender/export/campaigns")
                    if campaigns_response.status_code == 429:
                        if attempt < max_retries - 1:
                            print(f"⚠️  Rate limited (429), retrying in {retry_delay} seconds... (attempt {attempt + 1}/{max_retries})")
                            import time
                            time.sleep(retry_delay)
                            retry_delay *= 2
                            continue
                        else:
                            raise Exception(f"Rate limited after {max_retries} attempts")
                    elif campaigns_response.status_code != 200:
                        raise Exception(f"Failed to fetch campaigns: {campaigns_response.status_code}")
                    
                    campaigns_data = campaigns_response.json()
                    self.campaign_df = pd.DataFrame(campaigns_data['campaigns'])
                    
                    # Fetch interactions (contributions)
                    interactions_response = requests.get(f"{self.backend_url}/recommender/export/interactions")
                    if interactions_response.status_code == 429:
                        if attempt < max_retries - 1:
                            print(f"⚠️  Rate limited (429), retrying in {retry_delay} seconds... (attempt {attempt + 1}/{max_retries})")
                            import time
                            time.sleep(retry_delay)
                            retry_delay *= 2
                            continue
                        else:
                            print("⚠️  Rate limited for interactions, continuing without interaction data")
                            self.interactions_df = pd.DataFrame(columns=['userId', 'campaignId', 'weight'])
                    elif interactions_response.status_code != 200:
                        print("⚠️  No interactions found, using content-based similarity only")
                        self.interactions_df = pd.DataFrame(columns=['userId', 'campaignId', 'weight'])
                    else:
                        interactions_data = interactions_response.json()
                        self.interactions_df = pd.DataFrame(interactions_data['interactions'])
                    
                    # If we get here, all requests succeeded
                    break
                    
                except Exception as e:
                    if attempt < max_retries - 1:
                        print(f"⚠️  Request failed, retrying in {retry_delay} seconds... (attempt {attempt + 1}/{max_retries})")
                        import time
                        time.sleep(retry_delay)
                        retry_delay *= 2
                    else:
                        raise e
            
            if len(self.donor_df) == 0 or len(self.campaign_df) == 0:
                raise Exception("No donors or campaigns found in database")
            
            # Create embeddings
            self._create_embeddings()
            
            print(f"✅ Loaded {len(self.donor_df)} donors and {len(self.campaign_df)} campaigns from database")
            print(f"✅ Donor embeddings: {self.donor_embeddings.shape}")
            print(f"✅ Campaign embeddings: {self.campaign_embeddings.shape}")
            if len(self.interactions_df) > 0:
                print(f"✅ Loaded {len(self.interactions_df)} user-campaign interactions")
            
            return True
            
        except Exception as e:
            print(f"❌ Error loading data from backend: {e}")
            return False
    
    def _create_embeddings(self):
        """Create TF-IDF embeddings for donors and campaigns"""
        # Combine all text for fitting a single vectorizer
        donor_text = self.donor_df[donor_text_fields()].fillna("").agg(" ".join, axis=1).tolist()
        campaign_text = self.campaign_df[campaign_text_fields()].fillna("").agg(" ".join, axis=1).tolist()
        all_text = donor_text + campaign_text
        
        from sklearn.feature_extraction.text import TfidfVectorizer
        shared_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        shared_vectorizer.fit(all_text)
        
        # Get numeric fields and pad to match dimensions
        donor_numeric = donor_numeric_fields()
        campaign_numeric = campaign_numeric_fields()
        donor_pad = len(campaign_numeric) - len(donor_numeric)
        campaign_pad = len(donor_numeric) - len(campaign_numeric)
        
        donor_numeric_full = donor_numeric + [f"_pad_{i}" for i in range(donor_pad)] if donor_pad > 0 else donor_numeric
        campaign_numeric_full = campaign_numeric + [f"_pad_{i}" for i in range(campaign_pad)] if campaign_pad > 0 else campaign_numeric
        
        # Add dummy columns if needed
        for col in donor_numeric_full:
            if col not in self.donor_df.columns:
                self.donor_df[col] = 0.0
        for col in campaign_numeric_full:
            if col not in self.campaign_df.columns:
                self.campaign_df[col] = 0.0
        
        # Create embeddings
        self.donor_embeddings, _ = compute_tfidf_embeddings(
            self.donor_df,
            text_fields=donor_text_fields(),
            numeric_fields=donor_numeric_full,
            fit_vectorizer=shared_vectorizer
        )
        self.campaign_embeddings, _ = compute_tfidf_embeddings(
            self.campaign_df,
            text_fields=campaign_text_fields(),
            numeric_fields=campaign_numeric_full,
            fit_vectorizer=shared_vectorizer
        )
        
        self.donor_vectorizer = shared_vectorizer
        self.campaign_vectorizer = shared_vectorizer
    
    def create_interaction_matrix(self, sparsity=0.8):
        """Create interaction matrix from real contributions or content similarity"""
        n_donors = len(self.donor_df)
        n_campaigns = len(self.campaign_df)
        print(f"🔄 Creating interaction matrix for {n_donors} donors × {n_campaigns} campaigns...")
        
        interactions = np.zeros((n_donors, n_campaigns))
        
        if len(self.interactions_df) > 0:
            # Use real contribution data
            print("📊 Using real contribution data for interactions")
            for _, row in self.interactions_df.iterrows():
                donor_idx = self.donor_df[self.donor_df['id'] == row['userId']].index
                campaign_idx = self.campaign_df[self.campaign_df['id'] == row['campaignId']].index
                
                if len(donor_idx) > 0 and len(campaign_idx) > 0:
                    # Normalize contribution amount to 0-1 range
                    weight = min(row['weight'] / 1000, 1.0)  # Cap at 1000 for normalization
                    interactions[donor_idx[0], campaign_idx[0]] = weight
        else:
            # Create content-based interactions using TF-IDF similarity + keyword boost
            print("📊 Creating content-based interactions using TF-IDF similarity + keyword boost")
            
            for i in range(n_donors):
                donor_emb = self.donor_embeddings[i]
                donor_bio = self.donor_df.iloc[i]['bio'].lower() if self.donor_df.iloc[i]['bio'] else ""
                donor_name = self.donor_df.iloc[i]['name'].lower()
                donor_similarities = []
                
                for j in range(n_campaigns):
                    campaign_emb = self.campaign_embeddings[j]
                    campaign_category = self.campaign_df.iloc[j].get('category', '').lower()
                    campaign_title = self.campaign_df.iloc[j].get('title', '').lower()
                    campaign_desc = self.campaign_df.iloc[j].get('description', '').lower()
                    
                    # Calculate TF-IDF similarity
                    try:
                        tfidf_similarity = np.dot(donor_emb, campaign_emb) / (np.linalg.norm(donor_emb) * np.linalg.norm(campaign_emb))
                        if np.isnan(tfidf_similarity) or np.isinf(tfidf_similarity):
                            tfidf_similarity = 0.0
                    except:
                        tfidf_similarity = 0.0
                    
                    # Calculate keyword-based similarity boost
                    keyword_boost = 0.0
                    
                    # Simple keyword matching for better category alignment
                    if 'teacher' in donor_bio or 'education' in donor_bio:
                        if 'education' in campaign_category or 'technology' in campaign_category or 'smart' in campaign_title:
                            keyword_boost = 0.3
                    elif 'doctor' in donor_bio or 'health' in donor_bio:
                        if 'health' in campaign_category or 'fitness' in campaign_category or 'dental' in campaign_title:
                            keyword_boost = 0.3
                    elif 'fashion' in donor_bio or 'style' in donor_bio or 'creativity' in donor_bio:
                        if 'fashion' in campaign_category or 'art' in campaign_category or 'film' in campaign_category:
                            keyword_boost = 0.3
                    
                    # Combine TF-IDF similarity with keyword boost
                    combined_similarity = tfidf_similarity + keyword_boost
                    
                    donor_similarities.append((j, combined_similarity))
                
                # Sort by combined similarity and create interactions for top matches
                donor_similarities.sort(key=lambda x: x[1], reverse=True)
                
                # Create interactions for top 5 most similar campaigns per user
                for rank, (campaign_idx, similarity) in enumerate(donor_similarities[:5]):
                    # Create interaction even for low similarity to ensure NMF has data
                    interaction_strength = max(0.1, similarity)  # Minimum 0.1 strength
                    interactions[i, campaign_idx] = interaction_strength
        
        # Ensure we have at least some interactions for NMF to work
        if np.count_nonzero(interactions) == 0:
            print("⚠️  No interactions found, creating synthetic interactions for NMF training")
            # Create interactions for each donor with their most similar campaigns
            for i in range(n_donors):
                donor_emb = self.donor_embeddings[i]
                similarities = []
                
                for j in range(n_campaigns):
                    campaign_emb = self.campaign_embeddings[j]
                    try:
                        similarity = np.dot(donor_emb, campaign_emb) / (np.linalg.norm(donor_emb) * np.linalg.norm(campaign_emb))
                        if np.isnan(similarity) or np.isinf(similarity):
                            similarity = 0.0
                    except:
                        similarity = 0.0
                    similarities.append((j, similarity))
                
                # Sort and create interactions for top 3
                similarities.sort(key=lambda x: x[1], reverse=True)
                for rank, (campaign_idx, similarity) in enumerate(similarities[:3]):
                    interactions[i, campaign_idx] = 0.3 + (similarity * 0.4)  # Range: 0.3-0.7
        
        self.user_item_matrix = interactions
        print(f"✅ Created interaction matrix: {self.user_item_matrix.shape}")
        print(f"   Non-zero interactions: {np.count_nonzero(self.user_item_matrix)}")
        print(f"   Sparsity: {(self.user_item_matrix == 0).sum() / self.user_item_matrix.size:.2%}")
        print(f"   Min value: {np.min(self.user_item_matrix):.3f}")
        print(f"   Max value: {np.max(self.user_item_matrix):.3f}")
        print(f"   Mean value: {np.mean(self.user_item_matrix):.3f}")
        return self.user_item_matrix
    
    def fit_nmf(self):
        """Train NMF model on interaction matrix"""
        if self.user_item_matrix is None:
            raise ValueError("Interaction matrix not created.")
        
        print("🔄 Training NMF model...")
        
        # Check if matrix has enough non-zero values
        non_zero_count = np.count_nonzero(self.user_item_matrix)
        if non_zero_count < 4:  # Need at least 4 interactions for NMF to work
            print("⚠️  Very few interactions, using content-based fallback")
            return None
        
        # Normalize the matrix for better NMF training
        matrix_normalized = self.scaler.fit_transform(self.user_item_matrix)
        
        # Determine number of components (should be less than min dimension)
        max_components = min(self.n_components, matrix_normalized.shape[0], matrix_normalized.shape[1])
        # Use fewer components for small datasets
        if max_components > 3:
            max_components = 3
        
        print(f"   Using {max_components} components for {matrix_normalized.shape[0]}x{matrix_normalized.shape[1]} matrix")
        
        self.nmf_model = NMF(
            n_components=max_components,
            random_state=42,
            max_iter=500,  # More iterations for better convergence
            tol=0.001,
            init='random'  # Use random initialization
        )
        
        try:
            self.nmf_model.fit(matrix_normalized)
            
            # Check if model converged properly
            reconstructed = self.nmf_model.inverse_transform(self.nmf_model.transform(matrix_normalized))
            mse = np.mean((matrix_normalized - reconstructed) ** 2)
            
            print(f"✅ NMF model fitted with {self.nmf_model.n_components_} components")
            print(f"   Reconstruction MSE: {mse:.6f}")
            print(f"   Convergence: {self.nmf_model.n_iter_} iterations")
            
            # Test if model produces meaningful predictions
            test_predictions = self.nmf_model.transform(matrix_normalized)
            if np.all(test_predictions == 0):
                print("⚠️  NMF model produced all-zero predictions, using content-based fallback")
                return None
                
            return self.nmf_model
            
        except Exception as e:
            print(f"❌ NMF training failed: {e}")
            return None
    
    def get_recommendations(self, donor_id, top_k=5):
        """Get campaign recommendations for a donor using category-prioritized approach"""
        if self.nmf_model is None:
            print("📊 NMF model not available, using content-based recommendations")
            return self._get_content_based_recommendations(donor_id, top_k)
        
        try:
            donor_idx = self.donor_df[self.donor_df['id'] == donor_id].index[0]
        except IndexError:
            # Fallback to content-based similarity if user not found
            return self._get_content_based_recommendations(donor_id, top_k)
        
        if donor_idx >= len(self.donor_df):
            return pd.DataFrame()
        
        # Get user bio for category matching
        donor_bio = self.donor_df.iloc[donor_idx]['bio'].lower() if self.donor_df.iloc[donor_idx]['bio'] else ""
        
        # Determine user's preferred categories based on bio
        preferred_categories = []
        if 'teacher' in donor_bio or 'education' in donor_bio:
            preferred_categories = ['Education', 'Technology', 'Community']  # Added Community as fallback
        elif 'doctor' in donor_bio or 'health' in donor_bio:
            preferred_categories = ['Health & Fitness']
        elif 'fashion' in donor_bio or 'style' in donor_bio or 'creativity' in donor_bio:
            preferred_categories = ['Fashion', 'Art', 'Film & Video']
        else:
            # Default categories for users without clear preferences
            preferred_categories = ['Technology', 'Community']
        
        # Get all campaigns and their scores
        all_campaigns = []
        
        for j in range(len(self.campaign_df)):
            campaign_info = self.campaign_df.iloc[j]
            campaign_category = campaign_info.get('category', '')
            
            # Calculate category match score (high priority)
            category_match = 0.0
            if campaign_category in preferred_categories:
                category_match = 1.0
            
            # Get TF-IDF similarity score
            donor_emb = self.donor_embeddings[donor_idx]
            campaign_emb = self.campaign_embeddings[j]
            try:
                tfidf_similarity = np.dot(donor_emb, campaign_emb) / (np.linalg.norm(donor_emb) * np.linalg.norm(campaign_emb))
                if np.isnan(tfidf_similarity) or np.isinf(tfidf_similarity):
                    tfidf_similarity = 0.0
            except:
                tfidf_similarity = 0.0
            
            # Get NMF score
            donor_latent = self.nmf_model.components_.T[donor_idx]
            campaign_latent = self.nmf_model.components_
            nmf_score = np.dot(donor_latent, campaign_latent)
            # Fix the array comparison issue
            if isinstance(nmf_score, np.ndarray):
                nmf_score = nmf_score[0] if nmf_score.size > 0 else 0.0
            if np.isnan(nmf_score) or np.isinf(nmf_score):
                nmf_score = 0.0
            
            # Combine scores with category priority
            # Category match gets 60% weight, TF-IDF gets 30%, NMF gets 10%
            combined_score = (0.6 * category_match) + (0.3 * tfidf_similarity) + (0.1 * nmf_score)
            
            all_campaigns.append({
                'campaign_id': campaign_info['id'],
                'title': campaign_info['title'],
                'category': campaign_category,
                'category_match': category_match,
                'tfidf_similarity': tfidf_similarity,
                'nmf_score': nmf_score,
                'combined_score': combined_score
            })
        
        # Sort by combined score
        all_campaigns.sort(key=lambda x: x['combined_score'], reverse=True)
        
        # Take top_k recommendations
        top_campaigns = all_campaigns[:top_k]
        
        recommendations = []
        for campaign in top_campaigns:
            # Normalize score to 0-1 range
            score = max(0.0, min(1.0, campaign['combined_score']))
            
            recommendations.append({
                'campaign_id': campaign['campaign_id'],
                'title': campaign['title'],
                'category': campaign['category'],
                'predicted_score': float(score),
                'confidence': min(float(score) * 1.2, 1.0)
            })
        
        return pd.DataFrame(recommendations)
    
    def _get_content_based_recommendations(self, donor_id, top_k=5):
        """Fallback to content-based recommendations using TF-IDF similarity"""
        try:
            # Find user by wallet address if ID not found
            user_row = self.donor_df[self.donor_df['walletAddress'] == donor_id]
            if len(user_row) == 0:
                return pd.DataFrame()
            
            donor_idx = user_row.index[0]
            donor_emb = self.donor_embeddings[donor_idx]
            
            # Calculate similarity with all campaigns
            similarities = []
            for j in range(len(self.campaign_df)):
                campaign_emb = self.campaign_embeddings[j]
                try:
                    similarity = np.dot(donor_emb, campaign_emb) / (np.linalg.norm(donor_emb) * np.linalg.norm(campaign_emb))
                    # Handle NaN and infinite values
                    if np.isnan(similarity) or np.isinf(similarity):
                        similarity = 0.0
                except:
                    similarity = 0.0
                similarities.append((j, similarity))
            
            # Sort by similarity and get top_k
            similarities.sort(key=lambda x: x[1], reverse=True)
            top_campaigns = similarities[:top_k]
            
            recommendations = []
            for idx, similarity in top_campaigns:
                campaign_info = self.campaign_df.iloc[idx]
                # Ensure similarity is a valid number
                safe_similarity = float(similarity) if not (np.isnan(similarity) or np.isinf(similarity)) else 0.0
                
                recommendations.append({
                    'campaign_id': campaign_info['id'],
                    'title': campaign_info['title'],
                    'category': campaign_info['category'],
                    'predicted_score': safe_similarity,
                    'confidence': min(safe_similarity * 2, 1.0)
                })
            
            return pd.DataFrame(recommendations)
            
        except Exception as e:
            print(f"Error in content-based recommendations: {e}")
            return pd.DataFrame()
    
    def get_similar_donors(self, donor_id, n_neighbors=5):
        """Find similar donors based on latent factors or content similarity"""
        if self.nmf_model is None:
            return pd.DataFrame()
        
        try:
            donor_idx = self.donor_df[self.donor_df['id'] == donor_id].index[0]
        except IndexError:
            return pd.DataFrame()
        
        if donor_idx >= len(self.donor_df) or len(self.donor_df) <= 1:
            return pd.DataFrame()
        
        try:
            donor_latent = self.nmf_model.components_.T[donor_idx]
            similarities = []
            
            for i in range(len(self.donor_df)):
                if i != donor_idx:
                    other_latent = self.nmf_model.components_.T[i]
                    denom = np.linalg.norm(donor_latent) * np.linalg.norm(other_latent)
                    if denom == 0:
                        similarity = 0.0
                    else:
                        similarity = np.dot(donor_latent, other_latent) / denom
                    similarities.append((i, similarity))
            
            similarities.sort(key=lambda x: x[1], reverse=True)
            top_neighbors = similarities[:n_neighbors]
            
            if not top_neighbors:
                return pd.DataFrame()
            
            similar_donors = []
            for idx, similarity in top_neighbors:
                donor_info = self.donor_df.iloc[idx]
                similar_donors.append({
                    'donor_id': donor_info['id'],
                    'name': donor_info['name'],
                    'bio': donor_info['bio'],
                    'isVerified': donor_info['isVerified'],
                    'similarity_score': similarity
                })
            
            return pd.DataFrame(similar_donors)
            
        except Exception as e:
            print(f"Error in get_similar_donors: {e}")
            return pd.DataFrame()

if __name__ == "__main__":
    print("=== Database ML Recommendation System ===\n")
    
    # Get backend URL from environment or use default
    backend_url = os.getenv('BACKEND_API_URL', 'http://localhost:5050/api')
    
    recommender = DatabaseMLRecommender(n_components=10, backend_url=backend_url)
    
    if recommender.load_data_from_backend():
        recommender.create_interaction_matrix(sparsity=0.7)
        recommender.fit_nmf()
        
        if len(recommender.donor_df) > 0:
            donor_id = recommender.donor_df['id'].iloc[0]
            recommendations = recommender.get_recommendations(donor_id, top_k=3)
            print(f"\nRecommendations for {donor_id}:")
            if not recommendations.empty:
                print(recommendations[['campaign_id', 'title', 'predicted_score', 'confidence']])
            else:
                print("No recommendations available")
        
        print("\n✅ Database ML recommendation system ready!")
    else:
        print("❌ Failed to load data from backend.") 