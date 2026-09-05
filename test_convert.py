import requests
import base64
import os

print("🚀 Starting Manga Convert Test...")
try:
    with open('test.JPG', 'rb') as f:
        # Force content-type to image/jpeg
        files = {'file': ('test.jpg', f, 'image/jpeg')}
        data = {'style': 'shonen'}

        print("📡 Sending request to backend (Timeout: 120s)...")
        res = requests.post('http://localhost:8000/api/convert/manga', files=files, data=data, timeout=120)

        print(f"\n📊 Status Code: {res.status_code}")
        if res.status_code == 200:
            response_data = res.json()
            print("✅ SUCCESS! Image generated successfully.")

            # Extract base64 string from response
            b64_string = response_data.get("image_base64")
            if b64_string:
                # Remove the "data:image/jpeg;base64," prefix
                header, encoded_data = b64_string.split(",", 1)

                # Decode base64 to actual image bytes
                image_bytes = base64.b64decode(encoded_data)

                # Save to a file in the current directory
                output_filename = "output_manga_avatar.jpg"
                with open(output_filename, "wb") as f:
                    f.write(image_bytes)

                print(f"🎉 IMAGE SAVED SUCCESSFULLY!")
                print(f"👉 Check your folder: {os.path.abspath(output_filename)}")
                print("👉 Double-click the file to open and see your Manga Avatar!")
            else:
                print("⚠️ Success, but no image data found in response.")
        else:
            print("❌ FAILED!")
            print(res.text)

except FileNotFoundError:
    print("❌ ERROR: 'test.JPG' file not found in current folder!")
except requests.exceptions.Timeout:
    print("❌ ERROR: Request timed out. Backend is taking too long.")
except Exception as e:
    print(f"❌ EXCEPTION: {e}")