# 🌿 Aplicativo Identificação de Plantas Selvagens

**👩‍💻 Autora**

<em> Irlanda Hildeney Oliveira Teixeira<br>
Curso: Processamento de Imagens<br>
Prof: Haroldo Gomes<br>
CURSO DE ENGENHARIA DA COMPUTACAO/CCET<br></em>

Este projeto é um aplicativo identificação de plantas que utiliza Processamento de Imagens, Visão Computacional e Inteligência Artificial.  
O usuário faz o upload de uma imagem contendo uma planta, e o sistema analisa a imagem para identificar a espécie e fornecer informações.

O projeto foi desenvolvido como atividade acadêmica da disciplina de Processamento de Imagens / Visão Computacional.

---

## 📌 Funcionalidades

- Upload de imagens de plantas (JPG, PNG, WebP)
- Pré-processamento de imagens com **OpenCV**
- Validação automática se a imagem contém uma planta usando **EfficientNetB3**
- Extração de características visuais (cor, textura, bordas)
- Identificação da espécie usando a **API Plant.id**
- Exibição de:
  - Nome da planta
  - Nomes populares
  - Descrição
  - Toxicidade
  - Partes comestíveis
- Interface web moderna, responsiva e intuitiva
- Modo de teste local apenas com o modelo EfficientNet (sem usar API externa)

---

## 🧠 Tecnologias Utilizadas

### Back-end

- Python 3
- Flask
- OpenCV
- TensorFlow
- EfficientNetB3

### Front-end

- HTML5
- CSS3
- JavaScript

### API Externa

- Plant.id API

---

## 📂 Estrutura do Projeto

```text
TESTPLAN/
│
├── app.py                # Backend Flask e lógica principal
├── requirements.txt      # Dependências do projeto
│
├── templates/
│   └── index.html        # Interface principal
│
├── static/
│   ├── style.css         # Estilos da aplicação
│   └── script.js         # Lógica do front-end
│
└── uploads/              # Armazena imagens enviadas (criado automaticamente)


```

---

## ⚙️ Pré-requisitos

---

Antes de rodar o projeto, você precisa ter instalado:

- Python 3 ou superior
- pip (gerenciador de pacotes do Python)

Verifique se o Python está instalado:

```text
python --version

ou

py --version
```

---

## 🚀 Como Rodar o Projeto Localmente

1️⃣ Clone o repositório

```text
git clone colocar o link do projeto
cd seu-repositorio
```

2️⃣ Crie um ambiente virtual (opcional)

```text
python -m venv venv
venv\Scripts\activate
```

3️⃣ Instale as dependências

```text
pip install -r requirements.txt
```

⏳ Pode haver uma demora devido o TensorFlow ser uma biblioteca grande.

4️⃣Execute o servidor Flask

```text
python app.py
```

Se tudo estiver correto, você verá algo semelhante a:

```text
Identificador de Plantas com EfficientNetB3
Upload folder: seu diretorio
===========================================	
Running on http://127.0.0.1:5000
Running on http://192.168.100.53:5000
```
Clique em  <span style="color:#ADD8E6 ">follow link</span>

6️⃣ Acesse no navegador
Abra o navegador e acesse. ex:

```text
http://localhost:5000
```

---

## 🧪 Modos de Funcionamento

🔍 Identificação Completa

- Usa EfficientNet + OpenCV + Plant.id API
- Retorna informações detalhadas da planta

🧠 Teste Local (sem API)

- Botão “Testar Apenas EfficientNet”
- Executa somente o modelo local
- Útil para testes e validações sem consumir API

---

## 🧪 Processamento de Imagens Utilizado

O sistema realiza:

- Redimensionamento da imagem mantendo proporção
- Conversão de cores (BGR → HSV e escala de cinza)
- Extração de características como:
  - Cor média (HSV)
  - Contraste
  - Densidade de bordas
  - Intensidade do canal verde

Essas informações complementam a análise feita pela rede neural.

---

## ⚠️ Limitações do Projeto

- O modelo EfficientNet foi treinado no ImageNet, não especificamente em plantas
- A identificação final depende da API Plant.id
- Resultados podem variar conforme:
  - Qualidade da imagem
  - Iluminação
  - Ângulo da foto

---
