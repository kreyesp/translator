from fastapi import FastAPI, UploadFile, File

app = FastAPI()

@app.get("/")
async def root():
    return {"message":"Hello World"}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    data = await file.read()
    return {"text": f"Received {file.filename} ({len(data)} bytes) — placeholder"}

#used for debbuging check: http://localhost:3000/api/ping
@app.get("/ping")
def ping():
    return {"message": "pong"}
