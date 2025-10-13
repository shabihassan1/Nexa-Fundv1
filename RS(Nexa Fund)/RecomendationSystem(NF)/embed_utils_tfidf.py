# embed_utils_tfidf.py

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler

scaler = MinMaxScaler()

def compute_tfidf_embeddings(df, text_fields, numeric_fields, fit_vectorizer=None):
    """
    Generates hybrid embeddings using TF-IDF for text fields and scaled numeric fields.
    Args:
        df (pd.DataFrame): Input dataframe
        text_fields (list): List of column names to be joined for text embedding
        numeric_fields (list): List of numeric columns to be scaled
        fit_vectorizer (TfidfVectorizer or None): If provided, use this vectorizer; else fit new one
    Returns:
        np.ndarray: Normalized hybrid embeddings (TF-IDF + numeric)
        TfidfVectorizer: The fitted vectorizer (for reuse)
    """
    # Combine text fields
    text_input = df[text_fields].fillna("").agg(" ".join, axis=1).tolist()
    
    if fit_vectorizer is None:
        # Use better TF-IDF parameters for semantic meaning
        vectorizer = TfidfVectorizer(
            max_features=2000,  # More features for better differentiation
            stop_words='english',
            ngram_range=(1, 2),  # Include bigrams for better context
            min_df=1,  # Include all terms
            max_df=0.95,  # Remove very common terms
            sublinear_tf=True  # Use sublinear scaling for better balance
        )
        tfidf_matrix = vectorizer.fit_transform(text_input)
    else:
        vectorizer = fit_vectorizer
        tfidf_matrix = vectorizer.transform(text_input)
    
    tfidf_array = tfidf_matrix.toarray()
    
    # Scale numeric fields
    if numeric_fields:
        # Coerce errors to NaN, then fill with 0
        numeric_data = df[numeric_fields].apply(pd.to_numeric, errors='coerce').fillna(0).astype(float)
        numeric_scaled = scaler.fit_transform(numeric_data)
    else:
        numeric_scaled = np.zeros((len(df), 1))
    
    # Concatenate TF-IDF and numeric features
    combined = np.hstack((tfidf_array, numeric_scaled))
    
    # Normalize
    norms = np.linalg.norm(combined, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    return combined / norms, vectorizer

# Helper functions for new donor and campaign schemas

def donor_text_fields():
    # Use 'name' and 'bio' as text fields for donors
    return ["name", "bio"]

def donor_numeric_fields():
    # No numeric fields in new donor schema, but can use isVerified as int
    return ["isVerified"]

def campaign_text_fields():
    # Use 'title' and 'description' as text fields for campaigns
    return ["title", "description"]

def campaign_numeric_fields():
    # Use 'targetAmount', 'currentAmount', 'escrowAmount', 'releasedAmount', 'riskScore' as numeric fields
    return ["targetAmount", "currentAmount", "escrowAmount", "releasedAmount", "riskScore"]