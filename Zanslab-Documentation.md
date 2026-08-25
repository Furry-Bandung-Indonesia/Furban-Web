Dokumentasi API Gateway
Panduan untuk memakai ZansLab AI melalui API OpenAI dan Anthropic / Claude: buat API key, pilih model, kirim request, lihat usage, dan hubungkan ke tool coding favorit kamu.

Quick values

Base URL

https://zanslab.id/v1
Recommended model

an/claude-opus-5
Mode

OpenAI & Anthropic / Claude API

1. Quick start
Langkah paling pendek untuk request pertama.
Expand
1. Login atau register memakai email dan password.
2. Buka halaman API Keys, lalu buat API key.
3. Salin API key dari tabel aktif. API key baru dapat dicopy ulang kapan pun selama belum revoked.
4. Pastikan saldo cukup dari halaman Billing.
5. Jalankan request test berikut.
API key untuk contoh kode 
Tidak ada API Key
Belum ada API key aktif. Buat API key terlebih dahulu agar contoh kode dapat langsung dipakai.

Buat API Key
Linux/macOS curl

shell

Copy
curl -sS -X POST 'https://zanslab.id/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_9r_live_xxx' \
  --data-raw '{"model":"an/claude-opus-5","messages":[{"role":"user","content":"Halo, jawab singkat."}],"max_tokens":100}'
Windows PowerShell

powershell

Copy
$body = @{
  model = "an/claude-opus-5"
  messages = @(
    @{
      role = "user"
      content = "Halo, jawab singkat."
    }
  )
  max_tokens = 100
} | ConvertTo-Json -Depth 10 -Compress

Invoke-RestMethod `
  -Uri "https://zanslab.id/v1/chat/completions" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{
    Authorization = "Bearer sk_9r_live_xxx"
  } `
  -Body $body
Windows CMD

cmd

Copy
curl.exe -X POST "https://zanslab.id/v1/chat/completions" -H "Content-Type: application/json" -H "Authorization: Bearer sk_9r_live_xxx" --data-raw "{\"model\":\"an/claude-opus-5\",\"messages\":[{\"role\":\"user\",\"content\":\"Halo, jawab singkat.\"}],\"max_tokens\":100}"
2. Chat completions (OpenAI API)
Endpoint utama format OpenAI untuk mengirim prompt ke model.
Expand

POST
https://zanslab.id/v1/chat/completions
Copy
Endpoint ini mengikuti format OpenAI Chat Completions. Untuk saat ini, request wajib menyertakan model dan messages. Field max_tokens atau max_completion_tokens direkomendasikan, tetapi jika tidak dikirim gateway akan memakai limit default aman dari model.

API key untuk contoh kode 
Tidak ada API Key
Belum ada API key aktif. Buat API key terlebih dahulu agar contoh kode dapat langsung dipakai.

Buat API Key
model

ID model, contoh: an/claude-opus-5.

messages

Array pesan dengan role system, user, atau assistant.

max_tokens

Opsional tapi direkomendasikan untuk membatasi output dan biaya request.

temperature/top_p

Opsional untuk mengatur variasi jawaban.

Request body

json

Copy
{
  "model": "an/claude-opus-5",
  "messages": [
    { "role": "user", "content": "Halo, jawab singkat." }
  ],
  "max_tokens": 100
}
Authorization header

http

Copy
Authorization: Bearer sk_9r_live_xxx
List models

curl

Copy
curl https://zanslab.id/v1/models \
  -H "Authorization: Bearer sk_9r_live_xxx"
Response sukses mengikuti format OpenAI Chat Completions dan dapat menyertakan usage token. Response error berisi error.code, error.message, dan request_id.

Success response

json

Copy
{
  "id": "chatcmpl_xxx",
  "object": "chat.completion",
  "created": 1784628930,
  "model": "an/claude-opus-5",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Halo! Ada yang bisa saya bantu?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 10,
    "total_tokens": 34
  }
}
Error response

json

Copy
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid.",
    "request_id": "req_xxx",
    "details": {
      "fieldErrors": {
        "model": ["Required"]
      }
    }
  }
}
VALIDATION_ERROR

Body request belum valid. Pastikan model dan messages sudah dikirim.

INVALID_API_KEY

API key salah, tidak aktif, atau belum dikirim di header Authorization.

INSUFFICIENT_BALANCE

Saldo tidak cukup untuk menjalankan request.

MODEL_NOT_FOUND

Model ID tidak tersedia. Cek daftar model dari endpoint models.

3. Messages (Anthropic / Claude API)
Endpoint format native Anthropic / Claude untuk aplikasi yang memakai Anthropic API.
Expand

POST
https://zanslab.id/v1/messages
Copy
Endpoint ini mengikuti format Anthropic Claude Messages API (https://zanslab.id/v1/messages). Request wajib menyertakan model, max_tokens, dan array messages. Autentikasi didukung melalui header x-api-key atau Authorization: Bearer, serta header opsional anthropic-version: 2023-06-01.

API key untuk contoh kode 
Tidak ada API Key
Belum ada API key aktif. Buat API key terlebih dahulu agar contoh kode dapat langsung dipakai.

Buat API Key
model

ID model, contoh: an/claude-opus-5.

messages

Array pesan dengan role system, user, atau assistant.

max_tokens

Wajib diisi pada format Anthropic untuk batas output.

system

Opsional: string prompt sistem.

Anthropic Messages curl

shell

Copy
curl -X POST "https://zanslab.id/v1/messages" \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_9r_live_xxx" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"an/claude-opus-5","max_tokens":100,"messages":[{"role":"user","content":"Halo, jawab singkat."}]}'
Success response

json

Copy
{
  "id": "msg_01xxx",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Halo! Ada yang bisa saya bantu?"
    }
  ],
  "model": "an/claude-opus-5",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 15,
    "output_tokens": 10
  }
}
Error response

json

Copy
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid.",
    "request_id": "req_xxx",
    "details": {
      "fieldErrors": {
        "model": ["Required"]
      }
    }
  }
}
5. Contoh integrasi kode
curl (OpenAI & Anthropic), Node.js (OpenAI & Anthropic SDK), Python, JavaScript fetch, dan Postman.
Expand
API key untuk contoh kode 
Tidak ada API Key
Belum ada API key aktif. Buat API key terlebih dahulu agar contoh kode dapat langsung dipakai.

Buat API Key
cURL (OpenAI Chat Completions)

shell

Copy
curl https://zanslab.id/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_9r_live_xxx" \
  -d '{
  "model": "an/claude-opus-5",
  "messages": [
    { "role": "user", "content": "Halo, jawab singkat." }
  ],
  "max_tokens": 100
}'
cURL (Anthropic Messages API)

shell

Copy
curl -X POST "https://zanslab.id/v1/messages" \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_9r_live_xxx" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"an/claude-opus-5","max_tokens":100,"messages":[{"role":"user","content":"Halo, jawab singkat."}]}'
Node.js (OpenAI SDK)

typescript

Copy
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.ZANSLAB_API_KEY,
  baseURL: "https://zanslab.id/v1"
});

const completion = await client.chat.completions.create({
  model: "an/claude-opus-5",
  messages: [{ role: "user", content: "Halo!" }],
  max_tokens: 100
});

console.log(completion.choices[0].message.content);
Node.js (@anthropic-ai/sdk)

typescript

Copy
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ZANSLAB_API_KEY,
  baseURL: "https://zanslab.id/v1"
});

const message = await client.messages.create({
  model: "an/claude-opus-5",
  max_tokens: 100,
  messages: [{ role: "user", content: "Halo!" }]
});

console.log(message.content[0].text);
Python (OpenAI SDK)

python

Copy
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.environ["ZANSLAB_API_KEY"],
    base_url="https://zanslab.id/v1"
)

completion = client.chat.completions.create(
    model="an/claude-opus-5",
    messages=[{"role": "user", "content": "Halo!"}],
    max_tokens=100,
)

print(completion.choices[0].message.content)
Python (anthropic SDK)

python

Copy
import anthropic
import os

client = anthropic.Anthropic(
    api_key=os.environ["ZANSLAB_API_KEY"],
    base_url="https://zanslab.id/v1"
)

message = client.messages.create(
    model="an/claude-opus-5",
    max_tokens=100,
    messages=[{"role": "user", "content": "Halo!"}]
)

print(message.content[0].text)
JavaScript fetch

javascript

Copy
const response = await fetch("https://zanslab.id/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk_9r_live_xxx"
  },
  body: JSON.stringify({
    model: "an/claude-opus-5",
    messages: [{ role: "user", content: "Halo!" }],
    max_tokens: 100
  })
});

const data = await response.json();
console.log(data);
Postman / Insomnia checklist

text

Copy
Method: POST
URL: https://zanslab.id/v1/chat/completions
Headers:
  Content-Type: application/json
  Authorization: Bearer sk_9r_live_xxx
Body: raw JSON
{
  "model": "an/claude-opus-5",
  "messages": [
    { "role": "user", "content": "Halo, jawab singkat." }
  ],
  "max_tokens": 100
}