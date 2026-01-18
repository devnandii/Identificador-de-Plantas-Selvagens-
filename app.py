from flask import Flask, render_template, request, jsonify
import cv2
import requests
import base64
import os
import numpy as np
import tensorflow as tf

# ===============================
# MUDANÇA: Importar EfficientNet
# ===============================
from tensorflow.keras.applications.efficientnet import (
    EfficientNetB3, preprocess_input, decode_predictions
)
from tensorflow.keras.preprocessing import image as keras_image

# ===============================
# Configurações iniciais
# ===============================

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Sua chave API
PLANT_ID_API_KEY = "fb2dgnpQDHVN2abHTVuT5KE711C6jQPhPxiu11wNYD0NAPFKQA"

# ===============================
# Carregar EfficientNet
# ===============================
model = EfficientNetB3(weights="imagenet")
print("✅ EfficientNetB3 carregado com sucesso")

# ===============================
# Lista de categorias de plantas do ImageNet
# ===============================
PLANT_CATEGORIES = {
    # Categorias de flores
    "daisy", "sunflower", "rose", "tulip", "orchid", "carnation",
    "lily", "daffodil", "marigold", "petunia", "pansy", "dandelion",
    "hibiscus", "jasmine", "lavender", "lotus", "magnolia", "peony",
    
    # Categorias de árvores/arbustos
    "oak", "pine", "maple", "birch", "willow", "palm", "cedar",
    "spruce", "fir", "hemlock", "juniper", "redwood", "sequoia",
    "cypress", "eucalyptus", "chestnut", "hazel", "olive",
    
    # Categorias de frutas/vegetais
    "apple", "orange", "banana", "grape", "strawberry", "melon",
    "pumpkin", "cucumber", "pepper", "tomato", "potato", "carrot",
    "corn", "eggplant", "zucchini", "cabbage", "lettuce", "spinach",
    
    # Categorias de plantas específicas
    "cactus", "fern", "moss", "algae", "ivy", "bamboo", "reed",
    "sage", "thyme", "rosemary", "mint", "basil", "parsley",
    
    # Palavras gerais
    "plant", "tree", "flower", "leaf", "herb", "shrub", "vine",
    "grass", "fungus", "vegetable", "fruit", "berry", "seed",
    "blossom", "foliage", "greenery", "flora", "weed", "bush"
}

PLANT_KEYWORDS = [
    "plant", "tree", "flower", "leaf", "herb", "shrub",
    "fern", "cactus", "palm", "vine", "grass", "moss",
    "algae", "fungus", "vegetable", "fruit", "berry",
    "seed", "blossom", "foliage", "greenery", "flora"
]

def is_plant_category(label):
    """
    Verifica se o label pertence a uma categoria de planta
    """
    label_lower = label.lower()
    
    # Verificar categorias específicas
    for category in PLANT_CATEGORIES:
        if category in label_lower:
            return True
    
    # Verificar palavras-chave
    for keyword in PLANT_KEYWORDS:
        if keyword in label_lower:
            return True
    
    return False

# ===============================
# Função melhorada para detectar plantas
# ===============================
def is_plant(image_path):
    """
    Usa EfficientNet para verificar se a imagem contém uma planta
    Retorna: (é_planta, label, confiança)
    """
    try:
        # Carregar e pré-processar imagem
        img = keras_image.load_img(image_path, target_size=(300, 300))
        img_array = keras_image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)

        # Fazer predição
        preds = model.predict(img_array, verbose=0)
        
        # Decodificar resultados
        decoded = decode_predictions(preds, top=10)[0]

        # Verificar cada resultado
        for _, label, prob in decoded:
            if is_plant_category(label):
                return True, label, float(prob)

        # Se não encontrou plantas, retorna o resultado mais provável
        if decoded:
            return False, decoded[0][1], float(decoded[0][2])
        
        return False, "Nenhuma classe identificada", 0.0
        
    except Exception as e:
        print(f"Erro na detecção: {e}")
        return False, f"Erro: {str(e)}", 0.0

# ===============================
# Função para extrair características da imagem
# ===============================
def extract_image_features(image_path):
    """
    Extrai características visuais da planta usando OpenCV
    """
    img = cv2.imread(image_path)
    if img is None:
        return None
    
    features = {}
    
    try:
        # 1. Cores dominantes (HSV)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        mean_color = cv2.mean(hsv)
        features["hue"] = mean_color[0]
        features["saturation"] = mean_color[1]
        features["value"] = mean_color[2]
        
        # 2. Textura (contraste)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        features["contrast"] = float(gray.std())
        
        # 3. Forma (edge density)
        edges = cv2.Canny(gray, 100, 200)
        edge_pixels = np.sum(edges > 0)
        features["edge_density"] = float(edge_pixels / edges.size) if edges.size > 0 else 0
        
        # 4. Cor verde predominante (para plantas)
        green_channel = img[:, :, 1]  # Canal verde em BGR
        features["green_intensity"] = float(green_channel.mean())
        
    except Exception as e:
        print(f"Erro na extração de features: {e}")
        features["error"] = str(e)
    
    return features

# ===============================
# Função para análise complementar
# ===============================
def analyze_plant_characteristics(image_path, cnn_label):
    """
    Análise complementar baseada em características visuais
    """
    features = extract_image_features(image_path)
    if not features or "error" in features:
        return ["Análise visual indisponível"]
    
    analysis = []
    
    # Baseado na saturação (verde)
    saturation = features.get("saturation", 0)
    if saturation > 150:
        analysis.append("Cores muito vivas")
    elif saturation > 100:
        analysis.append("Cores moderadamente vivas")
    elif saturation > 50:
        analysis.append("Cores pouco saturadas")
    else:
        analysis.append("Cores desbotadas")
    
    # Baseado na densidade de bordas
    edge_density = features.get("edge_density", 0)
    if edge_density > 0.15:
        analysis.append("Muitos detalhes e bordas")
    elif edge_density > 0.05:
        analysis.append("Detalhes moderados")
    else:
        analysis.append("Poucos detalhes visíveis")
    
    # Baseado no contraste
    contrast = features.get("contrast", 0)
    if contrast > 60:
        analysis.append("Alto contraste")
    elif contrast > 30:
        analysis.append("Contraste médio")
    else:
        analysis.append("Baixo contraste")
    
    # Baseado no verde
    green_intensity = features.get("green_intensity", 0)
    if green_intensity > 100:
        analysis.append("Predominância de verde")
    
    return analysis

# ===============================
# Rotas
# ===============================

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/identify", methods=["POST"])
def identify():
    if "image" not in request.files:
        return jsonify({"error": "Nenhuma imagem enviada."})

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Arquivo inválido."})

    # Salvar imagem
    filename = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filename)

    # Pré-processamento com OpenCV
    img = cv2.imread(filename)
    if img is None:
        return jsonify({"error": "Erro ao ler a imagem."})

    # Redimensionar mantendo proporção
    height, width = img.shape[:2]
    max_size = 800
    if height > max_size or width > max_size:
        scale = max_size / max(height, width)
        new_width = int(width * scale)
        new_height = int(height * scale)
        img = cv2.resize(img, (new_width, new_height))
    
    cv2.imwrite(filename, img)

    # Validação com EfficientNet
    valid, label, confidence = is_plant(filename)

    # Análise complementar
    visual_analysis_list = analyze_plant_characteristics(filename, label)
    visual_analysis = " | ".join(visual_analysis_list)

    # Preparar resposta base com análise do EfficientNet
    base_response = {
        "cnn_info": {
            "label": label,
            "confidence": float(confidence),
            "is_plant": valid,
            "visual_analysis": visual_analysis
        }
    }

    if not valid:
        base_response["error"] = "A imagem pode não conter uma planta clara ou o modelo não reconheceu a espécie."
        base_response["suggestion"] = "Tente uma foto mais próxima das folhas ou flores."
        return jsonify(base_response)

    # Se for planta, enviar para API Plant.id
    try:
        with open(filename, "rb") as img_file:
            img_base64 = base64.b64encode(img_file.read()).decode("utf-8")

        payload = {
            "images": [img_base64],
            "plant_language": "pt",
            "plant_details": [
                "common_names",
                "description",
                "edible_parts",
                "toxicity",
                "wiki_description"
            ]
        }

        headers = {
            "Api-Key": PLANT_ID_API_KEY,
            "Content-Type": "application/json"
        }

        response = requests.post(
            "https://api.plant.id/v2/identify",
            json=payload,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Combinar resultado da API com análise do EfficientNet
            if "suggestions" in result and result["suggestions"]:
                result["efficientnet_analysis"] = base_response["cnn_info"]
                return jsonify(result)
            else:
                base_response["error"] = "A API não retornou sugestões para esta imagem."
                return jsonify(base_response)
        else:
            base_response["error"] = f"Erro na API Plant.id: {response.status_code}"
            return jsonify(base_response)

    except requests.exceptions.Timeout:
        base_response["error"] = "Tempo limite excedido na API Plant.id"
        return jsonify(base_response)
    except Exception as e:
        base_response["error"] = f"Erro na comunicação com API: {str(e)}"
        return jsonify(base_response)

# ===============================
# Nova rota para informações do modelo
# ===============================
@app.route("/model-info")
def model_info():
    """Retorna informações sobre o modelo em uso"""
    return jsonify({
        "model": "EfficientNetB3",
        "input_size": "300x300 pixels",
        "pretrained_on": "ImageNet (1000 classes)",
        "plant_categories": len(PLANT_CATEGORIES),
        "note": "Otimizado para detecção de plantas com 200+ categorias"
    })

# ===============================
# Rota para testar o modelo local
# ===============================
@app.route("/test-local", methods=["POST"])
def test_local():
    """Testa apenas o EfficientNet (sem API)"""
    if "image" not in request.files:
        return jsonify({"error": "Nenhuma imagem enviada."})

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Arquivo inválido."})

    filename = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filename)

    # Validar com EfficientNet
    valid, label, confidence = is_plant(filename)
    
    # Análise visual
    analysis_list = analyze_plant_characteristics(filename, label)
    
    return jsonify({
        "is_plant": valid,
        "detected_as": label,
        "confidence": float(confidence),
        "confidence_percent": f"{confidence * 100:.1f}%",
        "visual_analysis": analysis_list,
        "message": "Teste local do EfficientNetB3"
    })

# ===============================
# Inicialização
# ===============================
if __name__ == "__main__":
    print("=" * 50)
    print("Identificador de Plantas com EfficientNetB3")
    print(f"Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print("=" * 50)
    app.run(debug=True, host="0.0.0.0", port=5000)