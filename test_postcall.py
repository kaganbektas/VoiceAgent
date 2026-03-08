"""
ElevenLabs Post-Call Webhook Test
Gerçek ElevenLabs payload formatını simüle eder.

Kullanım:
  python test_postcall.py

Not: API_URL değişkenini kendi sunucu adresinle değiştir.
"""

import json
import urllib.request

API_URL = "http://localhost:5119/api/elevenlabs/post-call"

# -----------------------------------------------------------------------
# ElevenLabs'ın gerçek post-call webhook formatı
# tenant_id ve caller_phone custom_variables üzerinden geçirilir
# -----------------------------------------------------------------------
PAYLOAD_ELEVENLABS_FORMAT = {
    "type": "post_call_transcription",
    "event_timestamp": 1710000000,
    "data": {
        "agent_id": "test_agent_123",
        "conversation_id": "conv_test_001",
        "status": "done",
        "transcript": [
            {"role": "agent",    "message": "Merhaba, DigiAsistan'a hoş geldiniz. Size nasıl yardımcı olabilirim?", "time_in_call_secs": 0},
            {"role": "user",     "message": "Merhaba, yarın için randevu almak istiyorum.", "time_in_call_secs": 4},
            {"role": "agent",    "message": "Tabii ki! Adınızı öğrenebilir miyim?", "time_in_call_secs": 8},
            {"role": "user",     "message": "Ali Yılmaz.", "time_in_call_secs": 11},
            {"role": "agent",    "message": "Teşekkürler Ali Bey. Hangi saati tercih edersiniz?", "time_in_call_secs": 13},
            {"role": "user",     "message": "Öğleden sonra 14:00 olabilir mi?", "time_in_call_secs": 17},
            {"role": "agent",    "message": "14:00 için randevunuz oluşturuldu. İyi günler!", "time_in_call_secs": 21},
        ],
        "metadata": {
            "start_time_unix_secs": 1710000000,
            "call_duration_secs": 45
        },
        "analysis": {
            "transcript_summary": "Ali Yılmaz adlı müşteri yarın saat 14:00 için randevu aldı. Görüşme başarıyla tamamlandı.",
            "call_successful": "success",
            "evaluation_criteria_results": {},
            "data_collection_results": {}
        },
        # ElevenLabs'ın custom_variables alanı (Twilio entegrasyonunda sistem prompt'tan aktarılır)
        "custom_variables": {
            "tenant_id": "3",
            "caller_phone": "5551234567",
            "caller_name": "Ali Yilmaz"
        }
    }
}

# -----------------------------------------------------------------------
# Alternatif: conversation_initiation_client_data formatı
# -----------------------------------------------------------------------
PAYLOAD_ALT_FORMAT = {
    "type": "post_call_transcription",
    "event_timestamp": 1710000000,
    "data": {
        "conversation_id": "conv_test_002",
        "status": "done",
        "transcript": [
            {"role": "agent", "message": "Merhaba!", "time_in_call_secs": 0},
            {"role": "user",  "message": "Randevu almak istiyorum.", "time_in_call_secs": 3},
        ],
        "analysis": {
            "transcript_summary": "Müşteri randevu talebi iletti.",
            "call_successful": "success"
        },
        "conversation_initiation_client_data": {
            "custom_llm_extra_body": {
                "metadata": {
                    "tenant_id": 3,
                    "caller_phone": "5559876543"
                }
            }
        }
    }
}

# -----------------------------------------------------------------------
# Eski flat format (geriye dönük uyumluluk)
# -----------------------------------------------------------------------
PAYLOAD_FLAT_FORMAT = {
    "conversation_id": "conv_test_003",
    "tenant_id": 1,
    "caller_phone": "5550001111",
    "caller_name": "Ayse Demir",
    "transcript": "AI: Merhaba!\nMüşteri: Randevu almak istiyorum.",
    "summary": "Müşteri Ayse Demir randevu talep etti."
}


def send(label, payload):
    print(f"\n{'='*60}")
    print(f"TEST: {label}")
    print(f"{'='*60}")
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8")
            print(f"HTTP {resp.status}: {body}")
    except urllib.error.HTTPError as e:
        print(f"HTTP HATA {e.code}: {e.read().decode()}")
    except Exception as ex:
        print(f"HATA: {ex}")


if __name__ == "__main__":
    send("ElevenLabs Standart Format (custom_variables)", PAYLOAD_ELEVENLABS_FORMAT)
    send("ElevenLabs Alt Format (conversation_initiation_client_data)", PAYLOAD_ALT_FORMAT)
    send("Eski Flat Format (geriye dönük)", PAYLOAD_FLAT_FORMAT)

    print("\nTest tamamlandi.")
    print("Dashboard -> Musteriler ve Arama Gecmisi bölümlerini kontrol et.")
