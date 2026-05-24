const Groq = require('groq-sdk');

// Inicializar el cliente de Groq.
// El SDK busca automáticamente la variable de entorno GROQ_API_KEY.
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY === 'tu_api_key_de_groq_aqui' ? '' : process.env.GROQ_API_KEY
});

/**
 * Servicio para interactuar con la API de Groq.
 * @namespace groqService
 */
const groqService = {
    /**
     * Envía un historial de mensajes a la API de Groq para obtener una completación de chat.
     * @param {Array<Object>} mensajes - Lista de mensajes con formato { role: 'system'|'user'|'assistant', content: string }
     * @returns {Promise<string>} La respuesta generada por el asistente de IA.
     * @throws {Error} Excepción específica si la API de Groq falla o no está configurada.
     */
    enviarMensajeChat: async (mensajes) => {
        const apiKey = process.env.GROQ_API_KEY;
        const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

        if (!apiKey || apiKey === 'tu_api_key_de_groq_aqui' || apiKey.trim() === '') {
            throw new Error('La API Key de Groq no está configurada en las variables de entorno (.env)');
        }

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: mensajes,
                model: model,
                temperature: 0.5,
                max_tokens: 1024,
            });

            if (!chatCompletion.choices || chatCompletion.choices.length === 0) {
                throw new Error('La API de Groq devolvió una respuesta vacía sin opciones.');
            }

            return chatCompletion.choices[0].message.content;
        } catch (error) {
            console.error('Error al comunicarse con la API de Groq:', error);
            // Captura de excepciones específicas de la API
            if (error.status) {
                throw new Error(`Error de Groq API (Código ${error.status}): ${error.message}`);
            }
            throw error;
        }
    }
};

module.exports = groqService;
