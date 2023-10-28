export let savantHelpers = {
    'getIntellectDie': function _getIntellectDie(actor, returnDie = false) {
        if (!returnDie) return actor.system.scale['savant']['intellect-die'] ?? false;
        else return actor.system.scale['savant']['intellect-die']?.die ?? false;
    },
    'isMark': function _isMark(targetDoc) {
        return targetDoc.actor.flags.dae?.onUpdateTarget?.find(flag => flag.flagName === "Adroit Analysis" && flag.targetTokenUuid === targetDoc.uuid);
    },
    'isMarkSource': function _isMarkSource(markDoc, sourceDoc) {
        return markDoc.actor.flags.dae?.onUpdateTarget?.find(flag => flag.flagName === "Adroit Analysis" && flag.sourceTokenUuid === sourceDoc.uuid);
    }
}