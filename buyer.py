from flask import Blueprint, render_template, request, jsonify, abort
from app.models import Product, Category

buyer_bp = Blueprint("buyer", __name__)


@buyer_bp.route("/")
def index():
    categories = Category.query.all()
    # Featured: 8 most recent active products
    featured = (
        Product.query
        .filter_by(is_active=True)
        .order_by(Product.created_at.desc())
        .limit(8)
        .all()
    )
    return render_template("buyer/index.html", categories=categories, featured=featured)


@buyer_bp.route("/produtos")
def products():
    query = request.args.get("q", "").strip()
    category_slug = request.args.get("categoria", "").strip()
    page = request.args.get("page", 1, type=int)
    per_page = 12

    categories = Category.query.all()

    products_q = Product.query.filter_by(is_active=True)

    if query:
        like = f"%{query}%"
        products_q = products_q.filter(
            Product.name.ilike(like) | Product.description.ilike(like)
        )

    if category_slug:
        cat = Category.query.filter_by(slug=category_slug).first()
        if cat:
            products_q = products_q.filter_by(category_id=cat.id)

    pagination = products_q.order_by(Product.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return render_template(
        "buyer/products.html",
        products=pagination.items,
        pagination=pagination,
        categories=categories,
        current_query=query,
        current_category=category_slug,
    )


@buyer_bp.route("/produto/<int:product_id>")
def product_detail(product_id: int):
    product = Product.query.filter_by(id=product_id, is_active=True).first_or_404()
    related = (
        Product.query
        .filter_by(category_id=product.category_id, is_active=True)
        .filter(Product.id != product.id)
        .limit(4)
        .all()
    )
    return render_template("buyer/product_detail.html", product=product, related=related)


# --- JSON API endpoint for live search ---
@buyer_bp.route("/api/search")
def api_search():
    q = request.args.get("q", "").strip()
    if len(q) < 2:
        return jsonify([])

    like = f"%{q}%"
    results = (
        Product.query
        .filter_by(is_active=True)
        .filter(Product.name.ilike(like))
        .limit(6)
        .all()
    )
    return jsonify([
        {"id": p.id, "name": p.name, "price": p.formatted_price, "image": p.image}
        for p in results
    ])
