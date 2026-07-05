import app from './app';
import { getEnvOrThrow } from './common/utils/util';


const PORT = getEnvOrThrow('PORT');

if (process.env.NODE_ENV !== "test") {
    app.listen(3001, () => {
        console.log(`App is running on PORT ${PORT}`);
    })
};

