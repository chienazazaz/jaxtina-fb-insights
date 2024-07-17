import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretManager = new SecretManagerServiceClient();

export const getSecret = async (key: string) => {
    return secretManager
        .getProjectId()
        .then((projectId) => `projects/${projectId}/secrets/${key}/versions/latest`)
        .then((name) => secretManager.accessSecretVersion({ name }))
        .then(([res]) => res.payload?.data?.toString() || '');
};