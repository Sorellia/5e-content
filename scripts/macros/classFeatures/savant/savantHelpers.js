export let savantHelpers = {
    'isMark': function _isMark(targetDoc) {
        return targetDoc.actor.flags.dae?.onUpdateTarget?.find(flag => flag.flagName === "Adroit Analysis" && flag.targetTokenUuid === targetDoc.uuid);
    },
    'isMarkSource': function _isMarkSource(markDoc, sourceDoc) {
        return markDoc.actor.flags.dae?.onUpdateTarget?.find(flag => flag.flagName === "Adroit Analysis" && flag.sourceTokenUuid === sourceDoc.uuid);
    }
}