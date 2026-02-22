import json
import requests
import base64

for memeName, prompt in [
        ("Creepy Condescending Wonka", "Lumine (Genshin Impact)"),
        ("Disaster Girl", "Lumine (Genshin Impact), 1girl, house on fire"),
        ("Anime Girl Hiding from Terminator", "Lumine (Genshin Impact), 1girl, terminator"),
        ("Distracted Boyfriend", "Raiden Shogun, Aether (Genshin Impact), Furina (Genshin Impact), 3people"),
        ("Shut Up And Take My Money", "Lumine (Genshin Impact), 1girl")
    ]:
    image_data = open(f'public/images/memes/{memeName}.png', 'rb').read()
    base64_encoded_image = base64.b64encode(image_data).decode('utf-8')
    for blur in [0.8, 1, 1.2]:
        for adapter_weight in [0.7, 0.75, 0.8]:
            for intensity in [ 0.75, 0.7, 0.65]:
                body = json.dumps({
                    "prompt": f"{prompt}, best quality, 4k, masterpiece, highres, detailed, amazing quality",
                    "negative_prompt": "worst quality, nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, rating: sensitive, low contrast, signature, flexible deformity, abstract, low contrast,",
                    "image_size": {"width": 1024, "height":1024},
                    "num_images": 1,
                    "init_images": [base64_encoded_image],
                    "lineart_blur": blur,
                    "lineart_adapter_weight": adapter_weight,
                    "lineart_intensity": intensity,
                })

                response = requests.post('http://api2.runkomiko.com/generate_image', headers={'Content-Type': 'application/json'}, data=body)
                print(response)
                result = response.json()
                imageData = result["images"][0]
                # imageUri = f"data:image/jpeg;base64,{imageData}"
                with open(f'public/images/lineart/{blur}-{adapter_weight}-{intensity}-{memeName}.png', 'wb') as f:
                    f.write(base64.b64decode(imageData))


    # Use the results from requests_list as needed