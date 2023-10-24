import {helpers} from '../helpers.js';

export async function remoteDialog(title, options, content, format = 'row') {
    return await helpers.dialog(title, options, content, format);
}

export async function remoteDocumentDialog(title, uuids) {
    let documents = [];
    for (let i of uuids) {
        documents.push(await fromUuid(i));
    }
    return await helpers.selectDocument(title, documents, true);
}

export async function remoteDocumentsDialog(title, uuids) {
    let documents = [];
    for (let i of uuids) {
        documents.push(await fromUuid(i));
    }
    return await helpers.selectDocuments(title, documents, true);
}

export async function remoteAimCrosshair(tokenUuid, maxRange, icon, interval, size) {
    let token = await fromUuid(tokenUuid);
    return await helpers.aimCrosshair(token, maxRange, icon, interval, size);
}

export async function remoteMenu(title, buttons, input, useSpecialRender) {
    return await helpers.menu(title, buttons, input, useSpecialRender);
}