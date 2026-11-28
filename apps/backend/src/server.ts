import app from './app';
import 'dotenv/config'
const port = Number.parseInt(process.env.PORT ?? '3001', 10);

import { resumeExportService } from './modules/resume/resume-export.service';

if (process.env.NODE_ENV !== "test") {
    app.listen(port, '0.0.0.0', () => {
        console.log(`App is running on PORT ${port}`);
        resumeExportService.warmup().catch((err) => {
            console.warn('Initial browser warmup failed:', err);
        });
    })
};

