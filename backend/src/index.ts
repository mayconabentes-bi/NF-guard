import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`[server]: Server is running on all interfaces at port ${PORT}`);
});
