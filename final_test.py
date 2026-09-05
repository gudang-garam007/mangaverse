import requests

print("🚀 Testing Photo-to-Manga Upload...")

try:
    with open('test.JPG', 'rb') as f:
        # ✅ YE LINE 400 ERROR KO FIX KARTI HAI
        # Hum explicitly bata rahe hain ki ye file 'image/jpeg' hai
        files = {'file': ('image.jpg', f, 'image/jpeg')}
        data = {'style': 'shonen'}

        print("📡 Sending request (Timeout: 120s)...")
        res = requests.post('http://localhost:8000/api/convert/manga', files=files, data=data, timeout=120)

        if res.status_code == 200:
            print("✅ SUCCESS! Backend accepted the image and is processing it.")
            print("⏳ Agar Hugging Face model load ho raha hai, toh 20-30 seconds lag sakte hain.")
        else:
            print(f"❌ FAILED: {res.status_code}")
            print(res.text)

except FileNotFoundError:
    print("❌ ERROR: 'test.JPG' file is missing from this folder.")
except Exception as e:
    print(f"❌ EXCEPTION: {e}")