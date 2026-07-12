import app from './app';
import 'dotenv/config'
const port = Number.parseInt(process.env.PORT ?? '3001', 10);

if (process.env.NODE_ENV !== "test") {
    app.listen(port, () => {
        console.log(`App is running on PORT ${port}`);
    })
};

