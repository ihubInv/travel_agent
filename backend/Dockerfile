FROM python:3.10-slim

WORKDIR /app

COPY backend/requirements.txt .

RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    libssl-dev \
    libavdevice-dev \
    libavfilter-dev \
    libavformat-dev \
    libavcodec-dev \
    libavutil-dev \
    libswscale-dev \
    libswresample-dev \
 && pip install --upgrade pip \
 && pip install --retries=10 -r requirements.txt \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy shared environment and credentials
COPY .env /app/.env
COPY credentials /app/credentials

# Copy backend code
COPY backend/. .

EXPOSE 5000

CMD ["python3", "flight_booking.py"]








# FROM python:3.10-slim

# WORKDIR /app

# COPY requirements.txt .

# # Install build dependencies and necessary FFmpeg-related libs (excluding libavresample-dev)
# RUN apt-get update && apt-get install -y \
#     gcc \
#     libffi-dev \
#     libssl-dev \
#     libavdevice-dev \
#     libavfilter-dev \
#     libavformat-dev \
#     libavcodec-dev \
#     libavutil-dev \
#     libswscale-dev \
#     libswresample-dev \
#  && pip install --upgrade pip \
#  && pip install --retries=10 -r requirements.txt \
#  && apt-get clean && rm -rf /var/lib/apt/lists/*

# COPY . .

# EXPOSE 5000

# # Make sure your script path and usage are correct
# CMD ["python3", "flight_booking.py"]


# # Start the FastAPI app using uvicorn
# # CMD ["uvicorn", "flight_booking:app", "--host", "0.0.0.0", "--port", "5000"]
# # RUN pip install --default-timeout=100 --retries=10 -r requirements.txt
