import { createApp } from './config/app.js';
import { swaggerOptions } from './config/swagger.js';
import taskRoutes from './tasks/routes/taskRoutes.js';
import userRoutes from './users/routes/userRoutes.js';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = createApp();
const PORT = process.env.PORT || 3000;

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/tasks', taskRoutes);
app.use('/users', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Task Manager API running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Documentation: http://localhost:${PORT}/api-docs`);
});