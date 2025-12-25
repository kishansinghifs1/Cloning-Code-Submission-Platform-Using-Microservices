"""
User Repository
Database operations for user management
"""
from typing import Optional, Dict, List
from datetime import datetime
from bson import ObjectId
from src.config.db_config import get_database
from src.models.user_model import UserRole
import logging

logger = logging.getLogger(__name__)


class UserRepository:
    """Repository for user database operations"""
    
    def __init__(self):
        """Initialize the repository with database connection"""
        self.db = get_database()
        self.collection = None
        
    def _get_collection(self):
        """Get the users collection"""
        if self.collection is None:
            self.collection = self.db.users
        return self.collection
    
    async def create_user(self, user_data: Dict) -> Dict:
        """
        Create a new user in the database
        
        Args:
            user_data: User data dictionary
            
        Returns:
            Created user document
        """
        try:
            collection = self._get_collection()
            
            # Add timestamps
            user_data["created_at"] = datetime.utcnow()
            user_data["updated_at"] = datetime.utcnow()
            user_data["is_active"] = True
            user_data["is_verified"] = False
            user_data["role"] = user_data.get("role", UserRole.USER.value)
            
            result = await collection.insert_one(user_data)
            user_data["_id"] = str(result.inserted_id)
            
            logger.info(f"User created with ID: {user_data['_id']}")
            return user_data
            
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise e
    
    async def get_user_by_email(self, email: str) -> Optional[Dict]:
        """
        Find user by email
        
        Args:
            email: User email address
            
        Returns:
            User document or None if not found
        """
        try:
            collection = self._get_collection()
            user = await collection.find_one({"email": email})
            
            if user:
                user["_id"] = str(user["_id"])
            
            return user
            
        except Exception as e:
            logger.error(f"Error finding user by email: {e}")
            raise e
    
    async def get_user_by_username(self, username: str) -> Optional[Dict]:
        """
        Find user by username
        
        Args:
            username: Username
            
        Returns:
            User document or None if not found
        """
        try:
            collection = self._get_collection()
            user = await collection.find_one({"username": username})
            
            if user:
                user["_id"] = str(user["_id"])
            
            return user
            
        except Exception as e:
            logger.error(f"Error finding user by username: {e}")
            raise e
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """
        Find user by ID
        
        Args:
            user_id: User ID
            
        Returns:
            User document or None if not found
        """
        try:
            collection = self._get_collection()
            user = await collection.find_one({"_id": ObjectId(user_id)})
            
            if user:
                user["_id"] = str(user["_id"])
            
            return user
            
        except Exception as e:
            logger.error(f"Error finding user by ID: {e}")
            raise e
    
    async def update_user(self, user_id: str, update_data: Dict) -> Optional[Dict]:
        """
        Update user data
        
        Args:
            user_id: User ID
            update_data: Data to update
            
        Returns:
            Updated user document or None if not found
        """
        try:
            collection = self._get_collection()
            
            # Add updated timestamp
            update_data["updated_at"] = datetime.utcnow()
            
            result = await collection.find_one_and_update(
                {"_id": ObjectId(user_id)},
                {"$set": update_data},
                return_document=True
            )
            
            if result:
                result["_id"] = str(result["_id"])
                logger.info(f"User updated: {user_id}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise e
    
    async def update_last_login(self, user_id: str) -> bool:
        """
        Update user's last login timestamp
        
        Args:
            user_id: User ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = self._get_collection()
            
            result = await collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"last_login": datetime.utcnow()}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error updating last login: {e}")
            raise e
    
    async def delete_user(self, user_id: str) -> bool:
        """
        Soft delete a user (set is_active to False)
        
        Args:
            user_id: User ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = self._get_collection()
            
            result = await collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
            )
            
            if result.modified_count > 0:
                logger.info(f"User deactivated: {user_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            raise e
    
    async def get_all_users(self, skip: int = 0, limit: int = 10) -> List[Dict]:
        """
        Get all users with pagination
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of user documents
        """
        try:
            collection = self._get_collection()
            
            cursor = collection.find().skip(skip).limit(limit)
            users = await cursor.to_list(length=limit)
            
            for user in users:
                user["_id"] = str(user["_id"])
            
            return users
            
        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            raise e
    
    async def create_indexes(self):
        """Create database indexes for optimization"""
        try:
            collection = self._get_collection()
            
            # Create unique indexes
            await collection.create_index("email", unique=True)
            await collection.create_index("username", unique=True)
            
            # Create regular indexes
            await collection.create_index("created_at")
            await collection.create_index("is_active")
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
            raise e


# Global repository instance
user_repository = UserRepository()
