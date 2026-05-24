import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

db = SQLAlchemy()
login_manager = LoginManager()


def create_app(config=None):
    app = Flask(__name__, instance_relative_config=True)

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-angola-agro-2024")
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
        app.instance_path, "agro_market.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["MAX_CONTENT_LENGTH"] = 4 * 1024 * 1024

    if config:
        app.config.update(config)

    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"
    login_manager.login_message = "Por favor, inicie sessão para continuar."
    login_manager.login_message_category = "warning"

    from app.blueprints.auth import auth_bp
    from app.blueprints.buyer import buyer_bp
    from app.blueprints.seller import seller_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(buyer_bp)
    app.register_blueprint(seller_bp)

    with app.app_context():
        from app import models
        db.create_all()
        _seed_categories()

    _register_error_handlers(app)

    return app


def _seed_categories():
    from app.models import Category

    defaults = [
        ("Rações e Alimentos", "feed", "🌾"),
        ("Medicamentos Veterinários", "medicine", "💊"),
        ("Equipamentos e Ferramentas", "equipment", "🔧"),
        ("Acessórios e Outros", "other", "📦"),
    ]
    for name, slug, icon in defaults:
        if not Category.query.filter_by(slug=slug).first():
            from app import db as _db
            _db.session.add(Category(name=name, slug=slug, icon=icon))
    from app import db as _db
    _db.session.commit()


def _register_error_handlers(app):
    from flask import render_template

    @app.errorhandler(404)
    def not_found(e):
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def server_error(e):
        return render_template("errors/500.html"), 500

    @app.errorhandler(413)
    def too_large(e):
        return render_template("errors/413.html"), 413
