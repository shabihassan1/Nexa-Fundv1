# weighted_recommender.py - Multi-Algorithm Weighted Recommendation Engine

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import re

class WeightedRecommender:
    """
    Hybrid recommendation system with 4 algorithms:
    1. Interest Match (40%) - User preference-based matching
    2. Collaborative Filtering (30%) - NMF-based predictions
    3. Content Similarity (20%) - TF-IDF cosine similarity
    4. Trending Boost (10%) - Recent activity and urgency
    """
    
    def __init__(self, ml_recommender):
        """
        Args:
            ml_recommender: Instance of DatabaseMLRecommender with trained models
        """
        self.ml_recommender = ml_recommender
        
    def compute_interest_match_score(self, user_preferences: Dict, campaign: Dict) -> float:
        """
        Algorithm 1: Interest Match (40% weight)
        Scores based on user's selected interests and preferences
        
        Returns: Score between 0.0 and 1.0
        """
        if not user_preferences or not user_preferences.get('interests'):
            return 0.0
        
        score = 0.0
        
        # 1. Category Match (50% of interest score)
        user_interests = [interest.lower().strip() for interest in user_preferences.get('interests', [])]
        campaign_category = campaign.get('category', '').lower().strip()
        
        category_match = 0.0
        
        # Exact match
        if campaign_category in user_interests:
            category_match = 1.0
        else:
            # Enhanced fuzzy category matching
            for interest in user_interests:
                interest_clean = interest.replace('-', ' ').replace('_', ' ')
                category_clean = campaign_category.replace('-', ' ').replace('_', ' ')
                
                # Check substring match in both directions
                if interest_clean in category_clean or category_clean in interest_clean:
                    category_match = 0.8  # Increased from 0.5 for better partial matches
                    break
                
                # Check word overlap (e.g., "health & fitness" matches "healthcare")
                interest_words = set(interest_clean.split())
                category_words = set(category_clean.split())
                overlap = interest_words & category_words
                
                if len(overlap) > 0:
                    overlap_ratio = len(overlap) / max(len(interest_words), len(category_words))
                    if overlap_ratio >= 0.5:
                        category_match = max(category_match, 0.7)  # Good word overlap
                    elif overlap_ratio >= 0.3:
                        category_match = max(category_match, 0.5)  # Partial word overlap
        
        # 2. Keyword Match (30% of interest score)
        keyword_match = 0.0
        user_keywords = [kw.lower() for kw in user_preferences.get('interestKeywords', [])]
        
        if user_keywords:
            campaign_text = f"{campaign.get('title', '')} {campaign.get('description', '')} {campaign.get('story', '')}".lower()
            
            matched_keywords = 0
            for keyword in user_keywords:
                if keyword in campaign_text:
                    matched_keywords += 1
            
            if user_keywords:
                keyword_match = matched_keywords / len(user_keywords)
        
        # 3. Preference Alignment (20% of interest score)
        preference_match = 0.0
        
        # Funding goal preference
        funding_pref = user_preferences.get('fundingPreference', 'medium')
        target_amount = float(campaign.get('targetAmount', 0))
        
        if funding_pref == 'small' and target_amount <= 5000:
            preference_match += 0.33
        elif funding_pref == 'medium' and 5000 < target_amount <= 20000:
            preference_match += 0.33
        elif funding_pref == 'large' and target_amount > 20000:
            preference_match += 0.33
        elif funding_pref == 'any':
            preference_match += 0.33
        
        # Risk tolerance (creator history)
        risk_tolerance = user_preferences.get('riskTolerance', 'medium')
        creator_verified = campaign.get('creator', {}).get('isVerified', False)
        
        if risk_tolerance == 'low' and creator_verified:
            preference_match += 0.33
        elif risk_tolerance == 'medium':
            preference_match += 0.33
        elif risk_tolerance == 'high' and not creator_verified:
            preference_match += 0.33
        
        # Location preference (future enhancement - for now just add base score)
        preference_match += 0.34
        
        # Combine scores
        score = (category_match * 0.5) + (keyword_match * 0.3) + (preference_match * 0.2)
        
        return min(score, 1.0)
    
    def compute_collaborative_score(self, user_id: str, campaign_id: str) -> float:
        """
        Algorithm 2: Collaborative Filtering (30% weight)
        Uses NMF to predict user-campaign affinity
        
        Returns: Score between 0.0 and 1.0
        """
        try:
            if self.ml_recommender.nmf_model is None:
                return 0.0
            
            # Get user and campaign indices
            user_idx = self.ml_recommender.donor_df[
                self.ml_recommender.donor_df['id'] == user_id
            ].index
            
            campaign_idx = self.ml_recommender.campaign_df[
                self.ml_recommender.campaign_df['id'] == campaign_id
            ].index
            
            if len(user_idx) == 0 or len(campaign_idx) == 0:
                return 0.0
            
            # Get NMF prediction
            user_factors = self.ml_recommender.nmf_model.transform(
                self.ml_recommender.user_item_matrix[user_idx]
            )
            campaign_factors = self.ml_recommender.nmf_model.components_[:, campaign_idx]
            
            prediction = np.dot(user_factors, campaign_factors)[0, 0]
            
            # Normalize to 0-1 range
            max_possible = np.max(self.ml_recommender.user_item_matrix)
            normalized_score = min(prediction / max_possible if max_possible > 0 else 0, 1.0)
            
            return normalized_score
            
        except Exception as e:
            print(f"⚠️ Collaborative filtering error: {e}")
            return 0.0
    
    def compute_content_similarity_score(self, user_id: str, campaign_id: str, 
                                        user_preferences: Optional[Dict] = None) -> float:
        """
        Algorithm 3: Content Similarity (20% weight)
        Computes cosine similarity between user profile and campaign
        
        Returns: Score between 0.0 and 1.0
        """
        try:
            # Get user and campaign indices
            user_idx = self.ml_recommender.donor_df[
                self.ml_recommender.donor_df['id'] == user_id
            ].index
            
            campaign_idx = self.ml_recommender.campaign_df[
                self.ml_recommender.campaign_df['id'] == campaign_id
            ].index
            
            if len(user_idx) == 0 or len(campaign_idx) == 0:
                return 0.0
            
            # Get embeddings
            user_emb = self.ml_recommender.donor_embeddings[user_idx[0]]
            campaign_emb = self.ml_recommender.campaign_embeddings[campaign_idx[0]]
            
            # Compute cosine similarity
            similarity = np.dot(user_emb, campaign_emb) / (
                np.linalg.norm(user_emb) * np.linalg.norm(campaign_emb)
            )
            
            if np.isnan(similarity) or np.isinf(similarity):
                return 0.0
            
            # Normalize to 0-1 range
            normalized_score = (similarity + 1) / 2  # Cosine similarity is in [-1, 1]
            
            return max(0.0, min(normalized_score, 1.0))
            
        except Exception as e:
            print(f"⚠️ Content similarity error: {e}")
            return 0.0
    
    def compute_trending_score(self, campaign: Dict) -> float:
        """
        Algorithm 4: Trending Boost (10% weight)
        Scores based on recent activity and urgency
        
        Returns: Score between 0.0 and 1.0
        """
        score = 0.0
        
        # 1. Recent Contributions (40% of trending score)
        # For now, use contribution count as proxy
        contribution_count = campaign.get('_count', {}).get('contributions', 0)
        contribution_score = min(contribution_count / 50, 1.0)  # Cap at 50 contributions
        
        # 2. View Count (30% of trending score)
        # Not tracked yet, use contribution count as proxy
        view_score = contribution_score * 0.7  # Estimate views from contributions
        
        # 3. Funding Progress (20% of trending score)
        current_amount = float(campaign.get('currentAmount', 0))
        target_amount = float(campaign.get('targetAmount', 1))
        funding_progress = current_amount / target_amount if target_amount > 0 else 0
        
        # Boost campaigns that are close to goal (80%+)
        if funding_progress >= 0.8:
            progress_score = 1.0
        elif funding_progress >= 0.5:
            progress_score = 0.7
        else:
            progress_score = funding_progress
        
        # 4. Urgency (10% of trending score)
        urgency_score = 0.0
        try:
            end_date_str = campaign.get('endDate')
            if end_date_str:
                # Parse ISO date
                if 'T' in end_date_str:
                    end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                else:
                    end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
                
                days_left = (end_date - datetime.now()).days
                
                if days_left <= 3:
                    urgency_score = 1.0
                elif days_left <= 7:
                    urgency_score = 0.7
                elif days_left <= 14:
                    urgency_score = 0.4
                else:
                    urgency_score = 0.2
        except Exception as e:
            urgency_score = 0.2  # Default medium urgency
        
        # Combine scores
        score = (contribution_score * 0.4) + (view_score * 0.3) + (progress_score * 0.2) + (urgency_score * 0.1)
        
        return min(score, 1.0)
    
    def get_personalized_recommendations(self, user_id: str, user_preferences: Optional[Dict] = None,
                                        campaigns: List[Dict] = None, top_n: int = 20) -> List[Dict]:
        """
        Generate personalized recommendations using weighted multi-algorithm approach
        
        Args:
            user_id: User ID
            user_preferences: User's interest preferences (interests, fundingPreference, etc.)
            campaigns: List of campaign dictionaries to score
            top_n: Number of recommendations to return
            
        Returns:
            List of campaigns with scores, sorted by final score
        """
        if campaigns is None:
            # Use all campaigns from ML recommender
            campaigns = self.ml_recommender.campaign_df.to_dict('records')
        
        scored_campaigns = []
        
        # Determine weights based on user state
        has_preferences = user_preferences and user_preferences.get('interests')
        
        if has_preferences:
            # Full personalization with preferences
            weights = {
                'interest': 0.40,
                'collaborative': 0.30,
                'content': 0.20,
                'trending': 0.10
            }
        else:
            # No preferences - skip interest matching
            weights = {
                'interest': 0.00,
                'collaborative': 0.50,
                'content': 0.30,
                'trending': 0.20
            }
        
        for campaign in campaigns:
            campaign_id = campaign.get('id')
            
            # Skip if campaign is not ACTIVE
            if campaign.get('status') != 'ACTIVE':
                continue
            
            # Compute individual algorithm scores
            interest_score = self.compute_interest_match_score(user_preferences, campaign)
            collaborative_score = self.compute_collaborative_score(user_id, campaign_id)
            content_score = self.compute_content_similarity_score(user_id, campaign_id, user_preferences)
            trending_score = self.compute_trending_score(campaign)
            
            # Compute weighted final score
            final_score = (
                (interest_score * weights['interest']) +
                (collaborative_score * weights['collaborative']) +
                (content_score * weights['content']) +
                (trending_score * weights['trending'])
            )
            
            # Add scores to campaign
            campaign_with_score = campaign.copy()
            campaign_with_score['recommendationScore'] = round(final_score, 3)
            campaign_with_score['scores'] = {
                'interest': round(interest_score, 3),
                'collaborative': round(collaborative_score, 3),
                'content': round(content_score, 3),
                'trending': round(trending_score, 3)
            }
            
            # Add badge classification
            if final_score >= 0.80:
                campaign_with_score['badge'] = 'top_match'
            elif final_score >= 0.60:
                campaign_with_score['badge'] = 'recommended'
            else:
                campaign_with_score['badge'] = 'other'
            
            scored_campaigns.append(campaign_with_score)
        
        # Sort by final score descending
        scored_campaigns.sort(key=lambda x: x['recommendationScore'], reverse=True)
        
        return scored_campaigns[:top_n]
    
    def get_non_personalized_recommendations(self, campaigns: List[Dict] = None, 
                                            top_n: int = 20) -> List[Dict]:
        """
        Get trending campaigns for logged-out users
        Uses only trending score
        
        Returns:
            List of campaigns sorted by trending score
        """
        if campaigns is None:
            campaigns = self.ml_recommender.campaign_df.to_dict('records')
        
        scored_campaigns = []
        
        for campaign in campaigns:
            # Skip if campaign is not ACTIVE
            if campaign.get('status') != 'ACTIVE':
                continue
            
            trending_score = self.compute_trending_score(campaign)
            
            campaign_with_score = campaign.copy()
            campaign_with_score['recommendationScore'] = round(trending_score, 3)
            campaign_with_score['scores'] = {
                'trending': round(trending_score, 3)
            }
            campaign_with_score['badge'] = 'trending' if trending_score >= 0.6 else 'other'
            
            scored_campaigns.append(campaign_with_score)
        
        # Sort by trending score descending
        scored_campaigns.sort(key=lambda x: x['recommendationScore'], reverse=True)
        
        return scored_campaigns[:top_n]
