import os
import requests
from dotenv import load_dotenv
from fastapi import BackgroundTasks

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
EMAIL_FROM_NAME = "IRON GYM"
EMAIL_FROM_ADDRESS = os.getenv("EMAIL_FROM_ADDRESS", "ayendi200219@gmail.com")


def get_base_template(content: str, title: str):
    """Template base con diseño premium 'Iron Gym'"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #ffffff;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
            <tr>
                <td align="center" style="padding: 40px 0 30px 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
                        <!-- Header -->
                        <tr>
                            <td align="center" style="padding: 40px 0 20px 0; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);">
                                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 900; font-style: italic; letter-spacing: -1px; text-transform: uppercase;">
                                    IRON<span style="color: #0f172a;">GYM</span>
                                </h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px 40px 30px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td style="color: #f97316; font-size: 24px; font-weight: 800; padding-bottom: 20px; text-transform: uppercase; font-style: italic;">
                                            {title}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="color: #94a3b8; font-size: 16px; line-height: 24px;">
                                            {content}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 30px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
                                <p style="margin: 0; color: #64748b; font-size: 12px;">
                                    &copy; 2026 IRON GYM. Todos los derechos reservados.<br>
                                    Este es un mensaje automático, por favor no respondas.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def enviar_correo_base(destinatario: str, asunto: str, cuerpo_html: str):
    """Envía un correo usando la API HTTP de Brevo (funciona en Render free tier)."""
    try:
        if not BREVO_API_KEY:
            print(f"⚠️ BREVO_API_KEY no configurada. Simulando envío a {destinatario}: {asunto}")
            return

        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": BREVO_API_KEY,
        }
        payload = {
            "sender": {"name": EMAIL_FROM_NAME, "email": EMAIL_FROM_ADDRESS},
            "to": [{"email": destinatario}],
            "subject": asunto,
            "htmlContent": cuerpo_html,
        }

        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        print(f"✅ Correo enviado a {destinatario} | Brevo ID: {response.json().get('messageId', 'N/A')}")

    except requests.exceptions.HTTPError as e:
        print(f"❌ Error HTTP de Brevo: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        print(f"❌ Error enviando correo: {e}")


def enviar_correo_reserva_async(background_tasks: BackgroundTasks, email_usuario: str, nombre_usuario: str, nombre_clase: str, fecha_clase: str):
    title = "¡Reserva Confirmada!"
    content = f"""
        Hola <strong>{nombre_usuario}</strong>,<br><br>
        Tu plaza para la clase de <span style="color: #ffffff; font-weight: bold;">{nombre_clase}</span> ha sido reservada con éxito.<br><br>
        <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #334155;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td style="color: #f97316; font-weight: bold; font-size: 14px; text-transform: uppercase;">Detalles de la sesión</td>
                </tr>
                <tr>
                    <td style="color: #ffffff; font-size: 18px; padding-top: 8px;">{fecha_clase}</td>
                </tr>
            </table>
        </div>
        Recuerda llevar tu <strong>IRON PASS (QR)</strong> en el móvil para acceder a las instalaciones.<br><br>
        ¡Nos vemos en el entrenamiento!
    """
    html = get_base_template(content, title)
    background_tasks.add_task(enviar_correo_base, email_usuario, f"Confirmación: {nombre_clase} 🏋️‍♂️", html)


def notificar_bienvenida_cliente(background_tasks: BackgroundTasks, email_usuario: str, nombre_usuario: str):
    title = "¡Bienvenido a la Élite!"
    content = f"""
        Hola <strong>{nombre_usuario}</strong>,<br><br>
        Estamos encantados de tenerte en IRON GYM. Tu cuenta ha sido creada correctamente.<br><br>
        Desde tu panel de cliente podrás:<br>
        • Gestionar tus clases y reservas.<br>
        • Ver tus rutinas personalizadas.<br>
        • Seguir tu progreso físico detallado.<br><br>
        <a href="{FRONTEND_URL}" style="display: inline-block; background-color: #f97316; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 20px;">ENTRAR AL PANEL</a>
    """
    html = get_base_template(content, title)
    background_tasks.add_task(enviar_correo_base, email_usuario, "Bienvenido a IRON GYM 🥊", html)


def notificar_bienvenida_entrenador(background_tasks: BackgroundTasks, email_usuario: str, nombre_usuario: str):
    title = "¡Bienvenido al Equipo!"
    content = f"""
        Hola <strong>{nombre_usuario}</strong>,<br><br>
        Es un honor tenerte como entrenador en IRON GYM. Tu cuenta ha sido activada.<br><br>
        Desde tu panel de entrenador podrás:<br>
        • Ver y gestionar tus clases programadas.<br>
        • Crear y asignar rutinas a los clientes.<br>
        • Monitorear el progreso de tus clientes.<br><br>
        <a href="{FRONTEND_URL}/entrenador" style="display: inline-block; background-color: #f97316; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 20px;">ENTRAR AL PANEL</a>
    """
    html = get_base_template(content, title)
    background_tasks.add_task(enviar_correo_base, email_usuario, "Bienvenido al Equipo IRON GYM 🏋️", html)


def notificar_suspension_cuenta(background_tasks: BackgroundTasks, email_usuario: str, nombre_usuario: str, motivo: str):
    title = "Aviso de Suspensión"
    content = f"""
        Hola {nombre_usuario},<br><br>
        Te informamos que tu acceso a las instalaciones ha sido <span style="color: #ef4444; font-weight: bold;">suspendido temporalmente</span>.<br><br>
        <strong>Motivo:</strong><br>
        <div style="background-color: #450a0a; color: #fca5a5; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 15px 0;">
            {motivo}
        </div>
        Por favor, contacta con recepción para regularizar tu situación.
    """
    html = get_base_template(content, title)
    background_tasks.add_task(enviar_correo_base, email_usuario, "Urgente: Estado de tu cuenta ⚠️", html)


def notificar_alta_cliente_admin(background_tasks: BackgroundTasks, email_usuario: str, nombre_usuario: str, password_temporal: str):
    title = "¡Tu cuenta en IRON GYM!"
    content = f"""
        Hola <strong>{nombre_usuario}</strong>,<br><br>
        El administrador de <strong>IRON GYM</strong> ha creado tu cuenta de cliente. Ya tienes acceso completo.<br><br>
        <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #334155;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td style="color: #f97316; font-weight: bold; font-size: 14px; text-transform: uppercase; padding-bottom: 12px;">Tus credenciales de acceso</td>
                </tr>
                <tr>
                    <td style="color: #94a3b8; font-size: 14px; padding-bottom: 6px;">📧 <strong>Email:</strong> <span style="color: #ffffff;">{email_usuario}</span></td>
                </tr>
                <tr>
                    <td style="color: #94a3b8; font-size: 14px;">🔑 <strong>Contraseña:</strong> <span style="color: #f97316; font-family: monospace; font-size: 16px;">{password_temporal}</span></td>
                </tr>
            </table>
        </div>
        Tu membresía ya está <strong style="color: #22c55e;">ACTIVA</strong>. Entra ahora y comienza tu entrenamiento.<br><br>
        <a href="{FRONTEND_URL}" style="display: inline-block; background-color: #f97316; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 10px;">ENTRAR AL PANEL</a>
    """
    html = get_base_template(content, title)
    background_tasks.add_task(enviar_correo_base, email_usuario, "¡Tu acceso a IRON GYM está listo! 🥊", html)