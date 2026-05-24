from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from app import db, login_manager


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(30), nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="buyer")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    products = db.relationship("Product", back_populates="seller", lazy="dynamic",
                               cascade="all, delete-orphan")

    def set_password(self, raw: str) -> None:
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw: str) -> bool:
        return check_password_hash(self.password_hash, raw)

    @property
    def is_seller(self) -> bool:
        return self.role == "seller"

    @property
    def is_buyer(self) -> bool:
        return self.role == "buyer"

    def __repr__(self) -> str:
        return f"<User {self.email} [{self.role}]>"


@login_manager.user_loader
def load_user(user_id: str):
    return db.session.get(User, int(user_id))


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    slug = db.Column(db.String(40), unique=True, nullable=False, index=True)
    icon = db.Column(db.String(10), default="📦")

    products = db.relationship("Product", back_populates="category", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<Category {self.slug}>"


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price_aoa = db.Column(db.Numeric(12, 2), nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)
    image_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    seller_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)

    seller = db.relationship("User", back_populates="products")
    category = db.relationship("Category", back_populates="products")

    @property
    def formatted_price(self) -> str:
        return f"{self.price_aoa:,.2f} Kz"

    @property
    def in_stock(self) -> bool:
        return self.stock > 0

    @property
    def image(self) -> str:
        if self.image_url and self.image_url.startswith("http"):
            return self.image_url
        return f"https://placehold.co/600x400/2d5a27/ffffff?text={self.name[:15].replace(' ', '+')}"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price_aoa": float(self.price_aoa),
            "stock": self.stock,
            "image_url": self.image,
            "is_active": self.is_active,
            "category": self.category.name if self.category else "",
            "category_slug": self.category.slug if self.category else "",
            "seller_name": self.seller.name if self.seller else "",
            "seller_phone": self.seller.phone if self.seller else "",
        }

    def __repr__(self) -> str:
        return f"<Product {self.id}: {self.name}>"
