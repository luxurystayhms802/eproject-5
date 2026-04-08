import swaggerJsdoc from 'swagger-jsdoc';
export const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'LuxuryStay Hospitality API',
            version: '1.0.0',
            description: 'Production-style hotel management API for LuxuryStay Hospitality',
        },
        servers: [{ url: 'http://localhost:5000/api/v1' }],
    },
    apis: [],
});
