"""Initialize the database with tables"""
from app.database.models import Base
from app.database.connection import engine

def init_db():
    """Drop and recreate all tables"""
    print("Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db() 