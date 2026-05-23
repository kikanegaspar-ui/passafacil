from app import create_app

app = create_app()

if __name__ == "__main__":
    # Development server only — use gunicorn/waitress in production
    app.run(debug=True, host="0.0.0.0", port=5000)
