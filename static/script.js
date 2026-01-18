const imageInput = document.getElementById("imageInput");
const previewSection = document.getElementById("previewSection");
const previewImage = document.getElementById("previewImage");
const identifyButton = document.getElementById("identifyButton");
const removeImage = document.getElementById("removeImage");
const resultSection = document.getElementById("resultSection");
const plantResult = document.getElementById("plantResult");
const loading = document.getElementById("loading");
const uploadForm = document.getElementById("uploadForm");

// Preview da imagem
imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;

    // Verificar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert("Imagem muito grande. Máximo: 5MB");
        imageInput.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        previewImage.src = reader.result;
        previewSection.style.display = "block";
        plantResult.innerHTML = "";
        plantResult.style.display = "none";
    };
    reader.readAsDataURL(file);
});

// Remover imagem
removeImage.addEventListener("click", () => {
    imageInput.value = "";
    previewSection.style.display = "none";
    plantResult.innerHTML = "";
    plantResult.style.display = "none";
});

// Enviar para o backend
identifyButton.addEventListener("click", async () => {
    if (!imageInput.files.length) {
        alert("Por favor, selecione uma imagem primeiro.");
        return;
    }

    loading.style.display = "block";
    plantResult.style.display = "none";

    const formData = new FormData(uploadForm);

    try {
        const response = await fetch("/identify", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        loading.style.display = "none";

        if (data.error) {
            // Exibir informações do EfficientNet mesmo em erro
            let errorHtml = `
                <div class="error-message">
                    <h3><i class="fas fa-exclamation-triangle"></i> ${data.error || "Erro na identificação"}</h3>
            `;
            
            // CORREÇÃO: Verificar diferentes estruturas de dados
            const cnnData = data.cnn_info || data.efficientnet_analysis || data;
            
            if (cnnData && cnnData.label) {
                const confidence = cnnData.confidence || 0;
                const confidencePercent = (confidence * 100).toFixed(1);
                
                errorHtml += `
                    <div class="cnn-fallback">
                        <h4><i class="fas fa-brain"></i> Análise do EfficientNet:</h4>
                        <p><strong>Detectado como:</strong> ${cnnData.label}</p>
                        <p><strong>Confiança:</strong> ${confidencePercent}%</p>
                `;
                
                if (cnnData.visual_analysis) {
                    errorHtml += `<p><strong>Análise visual:</strong> ${cnnData.visual_analysis}</p>`;
                }
                
                if (data.suggestion) {
                    errorHtml += `<p><strong>Sugestão:</strong> ${data.suggestion}</p>`;
                }
                
                errorHtml += `</div>`;
            }
            
            errorHtml += `</div>`;
            plantResult.innerHTML = errorHtml;
            plantResult.style.display = "block";
            return;
        }

        // Processar resultado bem-sucedido
        if (data.suggestions && data.suggestions.length > 0) {
            const plant = data.suggestions[0];
            const efficientnetData = data.efficientnet_analysis || data.cnn_info || {};
            
            // Formatar com informações do EfficientNet
            let resultHtml = `
                <div class="plant-result-card">
                    <div class="plant-header">
                        <div class="plant-name">
                            <h2><i class="fas fa-leaf"></i> ${plant.plant_name || "Planta não identificada"}</h2>
                            ${plant.plant_details && plant.plant_details.common_names ? 
                                `<p class="common-names"><i class="fas fa-tags"></i> ${plant.plant_details.common_names.join(', ')}</p>` : ''}
                        </div>
                        <div class="confidence">
                            ${plant.probability ? (plant.probability * 100).toFixed(1) : "0.0"}%
                        </div>
                    </div>
                    
                    <div class="model-info">
                        <h4><i class="fas fa-microchip"></i> Análise do EfficientNetB3:</h4>
                        <div class="model-details">
                            <span class="efficientnet-badge">
                                <i class="fas fa-brain"></i> EfficientNetB3
                            </span>
                            <span><strong>Classificado como:</strong> ${efficientnetData.label || "Não detectado"}</span>
                            <span><strong>Confiança do modelo:</strong> ${efficientnetData.confidence ? (efficientnetData.confidence * 100).toFixed(1) : "0.0"}%</span>
                        </div>
                        ${efficientnetData.visual_analysis ? 
                            `<div class="visual-analysis">
                                <p><i class="fas fa-eye"></i> ${efficientnetData.visual_analysis}</p>
                            </div>` : ''}
                    </div>
            `;

            // Descrição
            const description = plant.plant_details?.description?.value || 
                              plant.plant_details?.wiki_description?.value || 
                              "Descrição não disponível.";
            
            resultHtml += `
                    <div class="plant-description">
                        <h3><i class="fas fa-info-circle"></i> Descrição</h3>
                        <p>${description}</p>
                    </div>
            `;

            // Toxicidade
            if (plant.plant_details?.toxicity) {
                resultHtml += `
                    <div class="toxicity">
                        <h3><i class="fas fa-skull-crossbones"></i> Toxicidade</h3>
                        <p>${plant.plant_details.toxicity}</p>
                    </div>
                `;
            }

            // Partes comestíveis
            if (plant.plant_details?.edible_parts) {
                resultHtml += `
                    <div class="edible-parts">
                        <h3><i class="fas fa-utensils"></i> Partes Comestíveis</h3>
                        <p>${plant.plant_details.edible_parts}</p>
                    </div>
                `;
            }

            // Sugestões alternativas
            if (data.suggestions.length > 1) {
                resultHtml += `
                    <div class="alternative-suggestions">
                        <h3><i class="fas fa-list"></i> Outras Possibilidades</h3>
                        <div class="suggestion-list">
                `;
                
                for (let i = 1; i < Math.min(data.suggestions.length, 4); i++) {
                    const alt = data.suggestions[i];
                    resultHtml += `
                        <div class="suggestion-chip">
                            <span>${alt.plant_name || "Desconhecido"}</span>
                            <small>${alt.probability ? (alt.probability * 100).toFixed(1) : "0.0"}%</small>
                        </div>
                    `;
                }
                
                resultHtml += `
                        </div>
                    </div>
                `;
            }

            resultHtml += `</div>`;
            
            plantResult.innerHTML = resultHtml;
            plantResult.style.display = "block";
            
            // Rolar para resultados
            plantResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
        } else {
            plantResult.innerHTML = `
                <div class="error-message">
                    <h3><i class="fas fa-question-circle"></i> Nenhuma planta identificada</h3>
                    <p>A API não conseguiu identificar a planta na imagem.</p>
                </div>
            `;
            plantResult.style.display = "block";
        }

    } catch (error) {
        console.error("Erro:", error);
        loading.style.display = "none";
        plantResult.innerHTML = `
            <div class="error-message">
                <h3><i class="fas fa-exclamation-triangle"></i> Erro de Conexão</h3>
                <p>Não foi possível conectar ao servidor. Verifique sua conexão.</p>
                <p>Erro técnico: ${error.message}</p>
            </div>
        `;
        plantResult.style.display = "block";
    }
});

// Adicionar arrastar e soltar
const uploadArea = document.getElementById("uploadArea");

uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = "rgba(76, 175, 80, 0.1)";
    uploadArea.style.borderColor = "#4CAF50";
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.style.backgroundColor = "";
    uploadArea.style.borderColor = "";
});

uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = "";
    uploadArea.style.borderColor = "";
    
    if (e.dataTransfer.files.length) {
        imageInput.files = e.dataTransfer.files;
        imageInput.dispatchEvent(new Event("change"));
    }
});

// Adicionar informações do modelo
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("/model-info");
        const modelInfo = await response.json();
        
        // Adicionar badge informativo
        const appDescription = document.querySelector(".app-description p");
        if (appDescription) {
            appDescription.innerHTML += ` Usando <strong>${modelInfo.model}</strong> para análise inicial.`;
        }
    } catch (error) {
        console.log("Não foi possível carregar informações do modelo");
    }
});

// Teste local do modelo
document.addEventListener("DOMContentLoaded", () => {
    const testButton = document.createElement("button");
    testButton.className = "btn-primary";
    testButton.style.marginTop = "10px";
    testButton.style.backgroundColor = "#667eea";
    testButton.innerHTML = '<i class="fas fa-flask"></i> Testar Apenas EfficientNet';
    testButton.onclick = testLocalModel;
    
    const actionButtons = document.querySelector(".action-buttons");
    if (actionButtons) {
        actionButtons.appendChild(testButton);
    }
});

async function testLocalModel() {
    if (!imageInput.files.length) {
        alert("Por favor, selecione uma imagem primeiro.");
        return;
    }

    loading.style.display = "block";
    plantResult.style.display = "none";

    const formData = new FormData(uploadForm);

    try {
        const response = await fetch("/test-local", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        loading.style.display = "none";

        let resultHtml = `
            <div class="plant-result-card">
                <div class="model-info">
                    <h4><i class="fas fa-flask"></i> Teste Local do EfficientNetB3</h4>
        `;

        if (data.is_plant) {
            resultHtml += `
                <div style="color: #4CAF50; margin: 15px 0; font-size: 1.2rem;">
                    <i class="fas fa-check-circle"></i> <strong>É uma planta!</strong>
                </div>
                <p><strong>Detectado como:</strong> ${data.detected_as}</p>
                <p><strong>Confiança:</strong> ${data.confidence_percent}</p>
            `;
        } else {
            resultHtml += `
                <div style="color: #ff9800; margin: 15px 0; font-size: 1.2rem;">
                    <i class="fas fa-exclamation-triangle"></i> <strong>Pode não ser uma planta clara</strong>
                </div>
                <p><strong>Classificado como:</strong> ${data.detected_as}</p>
                <p><strong>Confiança:</strong> ${data.confidence_percent}</p>
            `;
        }

        if (data.visual_analysis && data.visual_analysis.length > 0) {
            resultHtml += `
                <div class="visual-analysis" style="margin-top: 15px;">
                    <h5><i class="fas fa-eye"></i> Análise Visual:</h5>
                    <ul style="padding-left: 20px; margin-top: 10px;">
            `;
            
            data.visual_analysis.forEach(item => {
                resultHtml += `<li>${item}</li>`;
            });
            
            resultHtml += `
                    </ul>
                </div>
            `;
        }

        resultHtml += `
                </div>
                <p style="margin-top: 20px; font-size: 0.9rem; color: #666;">
                    <i class="fas fa-info-circle"></i> Este é um teste apenas do modelo EfficientNet local, sem usar a API externa.
                </p>
            </div>
        `;

        plantResult.innerHTML = resultHtml;
        plantResult.style.display = "block";

    } catch (error) {
        loading.style.display = "none";
        plantResult.innerHTML = `
            <div class="error-message">
                <h3><i class="fas fa-exclamation-triangle"></i> Erro no Teste Local</h3>
                <p>${error.message}</p>
            </div>
        `;
        plantResult.style.display = "block";
    }
}