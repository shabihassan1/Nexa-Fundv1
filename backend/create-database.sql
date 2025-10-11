-- Create NexaFund Database
-- Run this script in PostgreSQL to create the database and user

-- Create the database
CREATE DATABASE nexafund_db;

-- Create a dedicated user for the application (optional)
-- You can skip this if you want to use the postgres user
CREATE USER nexafund_user WITH PASSWORD 'nexafund_password';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE nexafund_db TO nexafund_user;

-- Connect to the new database and grant schema privileges
\c nexafund_db;

-- Grant privileges on the public schema
GRANT ALL ON SCHEMA public TO nexafund_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nexafund_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nexafund_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nexafund_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO nexafund_user;

-- Display success message
\echo 'Database nexafund_db created successfully!'
\echo 'User nexafund_user created with password: nexafund_password'
\echo 'You can now update your .env file with these credentials'
