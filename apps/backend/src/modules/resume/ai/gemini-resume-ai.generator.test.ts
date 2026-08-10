import test from 'node:test';
import assert from 'node:assert/strict';
import type { GoogleGenAI } from '@google/genai';
import { GeminiAiProviderError, GeminiResumeAiGenerator } from './gemini-resume-ai.generator';

test('requests structured resume enhancements without sending personal contact fields', async () => {
    let request: unknown;
    const client = {
        interactions: {
            async create(input: unknown) {
                request = input;
                return {
                    output_text: JSON.stringify({
                        professionalTitle: 'Platform Engineer',
                        experiences: [{ id: 'experience-1', description: 'Built reliable services.' }],
                        skills: ['TypeScript'],
                    }),
                };
            },
        },
    } as unknown as GoogleGenAI;
    const generator = new GeminiResumeAiGenerator(client, 'test-model');

    await generator.enhance({
        contact: {
            fullName: 'Private Name', title: 'Developer', email: 'private@example.com',
            phone: '+1 202 555 0199', location: 'Private Address', linkedin: 'https://linkedin.example/private-profile',
        },
        experience: [{
            id: 'experience-1', jobTitle: 'Engineer', company: 'Example', location: 'Remote', current: true,
            startMonth: 'January', startYear: '2022', endMonth: '', endYear: '', description: 'Built services.',
        }],
        education: [], certifications: [], skills: ['TypeScript'],
    }, 'private-user-id');

    const params = request as {
        model: string;
        store: boolean;
        system_instruction: string;
        input: string;
        response_format: { type: string; mime_type: string; schema: unknown };
    };

    assert.equal(params.model, 'test-model');
    assert.equal(params.store, false);
    assert.equal(params.response_format.mime_type, 'application/json');
    assert.match(params.system_instruction, /ATS-compatible resumes/);
    assert.match(params.system_instruction, /When a source description is empty or very short/);
    assert.match(params.system_instruction, /conservative responsibility lines/);
    assert.match(params.system_instruction, /Never invent metrics, named projects/);
    assert.match(params.system_instruction, /every source experience exactly once/);
    assert.match(params.input, /^<resume_data>/);
    assert.match(params.input, /Built services/);
    assert.doesNotMatch(params.input, /Private Name|private@example\.com|202 555|Private Address|linkedin\.example/);
});

test('classifies Gemini quota failures without exposing provider details', async () => {
    const client = {
        interactions: {
            async create() {
                throw Object.assign(new Error('Quota exceeded for a private project'), { status: 429 });
            },
        },
    } as unknown as GoogleGenAI;
    const generator = new GeminiResumeAiGenerator(client, 'test-model');

    await assert.rejects(
        generator.enhance({
            contact: { fullName: '', title: '', email: '', phone: '', location: '', linkedin: '' },
            experience: [], education: [], certifications: [], skills: [],
        }, 'user-1'),
        (error: unknown) => error instanceof GeminiAiProviderError
            && error.code === 'QUOTA_EXCEEDED'
            && !error.message.includes('private project'),
    );
});

test('classifies an invalid Gemini key from a Google 400 response', async () => {
    const client = {
        interactions: {
            async create() {
                throw Object.assign(new Error('API key not valid. Private provider detail.'), { status: 400 });
            },
        },
    } as unknown as GoogleGenAI;
    const generator = new GeminiResumeAiGenerator(client, 'test-model');

    await assert.rejects(
        generator.enhance({
            contact: { fullName: '', title: '', email: '', phone: '', location: '', linkedin: '' },
            experience: [], education: [], certifications: [], skills: [],
        }, 'user-1'),
        (error: unknown) => error instanceof GeminiAiProviderError
            && error.code === 'AUTH_FAILED'
            && !error.message.includes('Private provider detail'),
    );
});
