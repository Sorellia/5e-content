# 0.6.1 Release:
Stage 2 of the Savant! At this point, every core part of the class is in. The subclass is still to come however. For once, no updates to the blood hunter were warranted!

Further updates are expected to start adding parts of rune scribe, as well as port over a couple of cleric features and some other house rule stuff I'm using, including BG3 Weapon Actions.

## New Content:
* Savant has received numerous fixes and all of the scholarly pursuits which can be automated, have been.
* The start of a system for automatically handling class/race proficiencies and such is in, too.

## Bug Fixes:
* Quite a few with Savant! Namely within Quick Study and some streamlining to handle the meditation scholarly pursuit.

## Update Notes:
* Quick Study now correctly understands that *yes*, vehicle proficiences *ARE* in fact counted as tools in 5e...
* Implementation for all automateable scholarly pursuits, including handing out skills, proficiencies, languages and the like.
* Several updates to Savant at large, to quash a few bugs.

# 0.6 Release:
Heeeeere comes the Savant! A much simpler class to work with than blood hunter, but with a surprising amount automate all the same! Also contained are a bunch of updates to blood hunter that I forgot!

This release brings in the core savant features + rune scribe's student of runes (partial automation); the scholarly pursuits and the rest of my player's savant subclass (Rune Scribe) are not yet automated, but are coming.

Also upcoming are features for the Baldur's Gate 3 Weapon Actions.

## New Content:
* Core Savant has been fully automated; every feature is completely automated where possible; the bucket-list is vast, but the standout feature is by far Adroit Analysis, which has you mark a target and then turns your weapon attacks into int scaling when attacking that target.

## Bug Fixes:
* Forgot to implement vital sacrifice automation for spectral nature...
* Then forgot to bug fix spectral nature's includes and it didn't work... D'oh!
* Rite of blindness now correctly gives the reaction to the Blood Hunter using it!

## Update Notes
* Spectral Nature has been automated, and several bugs fixed with other parts of blood hunter automation; more will be fixed as the class sees use in my campaign.
* Savant is mostly implemented as its core features have received automation; the rest of the class needs automating, but won't be quite as bad.
* Several console declarations have been removed to tidy things up a bit.
* The helper code has been updated with various functions used to aid in savant's more 'broad' applications, such of tool, skill, language and weapon proficiency adjustments.

# 0.5.55 Release:
And here comes that sneaky final blood hunter release! This is the actual final version this time, carrying support for the order of salt and iron's unique features (including its interaction with rests). To make the most of these features the Rest Recovery module is needed.

A bit of a small one. Next update will include the savant's first features.

## New Content:
* The order of salt and iron is fully implemented with all features accounted for.

# 0.5.5 Release:
The final phase of the blood hunter release is here! This is the final version, bringing in the final 3 Rites (Decay, Exposure and Revelation), as well as the Crimson Offering and Crimson Brand class features and their upgrades. With these, the core blood hunter is finished, and work can begin on v0.6 - the Savant update (another class by LaserLlama).

Order of Salt & Iron for blood hunter is also underway, and will release as either 0.5.55 or as part of 0.6, with the first parts of the Savant class update.

## New Content:
* The final three blood hunter rites are in, as well as the class features that need to be handled to call the class fully automated.
* The first subclass features for the Order of Salt & Iron are in; more to come soon.

## Bug Fixes:
* Yet more codebase streamlining to make blood rite automation a bit better; now includes significant updates to how vital sacrifice stacks are handled in the code (gone are the days of 20+ effect stacks for all your vital sacrifices, now they are all cleanly stored in one updating effect).

## Update Notes:
* Rite of Decay, Exposure and Revelation have all been fully automated, which brings all rites into the module with fully automation.
* Crimson Offering & Improved Crimson Offering have been automated.
* Crimson Brand & Crimson Anchor have been automated; these features rely on the Crimson Offering automation to function effectively.
* Curse Specialist is the first of the OS&I features to be automated; only partial automation has been achieved right now (rites now have blood-type restrictions, which a vital sacrifice or the curse specialist feature removes).
* Reliance on warpgate features has been decreased significantly, which allows for more performance; warpgate was primarily used in the past for effect application and item adjustments; right now, it is only used for the latter, and effects have been moved to be applied more traditionally; this reduces document lag and was particularly valuable to the vital sacrifice fixes.

# 0.5.03 Release:
The next phase of the blood hunter release is here! This version brings the remaining rites to automate down to just 3, as well as a few various class features. Also included are some new utility features which were implemented to aid in the creation of the automation for the rite of blindness, which is this module's first Reaction-based automation inclusion!

## New Content:
* Further automation of blood rite runes.

## Bug Fixes:
* Streamlined several parts of the codebase in regards to blood rites to make them flow better and be less... hacky, in particular with vital sacrifices.

## Update Notes:
* Rite of Blindness, Exsanguination and Siphoning have all been fully automated.
* All Rites have had their codebase improved and made more efficient, should iron out any final kinks in them programmatically.

# 0.5.02 Release:

## New Content:
* Initial automation of blood hunter rites. See the update notes for the caveat.

## Update Notes:
* The rites have been automated for LaserLlama's blood hunter; the following rites are not yet covered:
*   Rite of Blindness
*   Rite of Decay
*   Rite of Exposure
*   Rite of Exsanguination (Complete, just needs refactoring)
*   Rite of Siphoning (Complete, just needs refactoring)
*   Rite of Revelation

# 0.5 Release:

## New Content:
* Initial Release; currently contains nothing, or perhaps everything?

## Bug Fixes:
* Custom Class Feature Types

## Update Notes
* Declaration of custom class feature types works properly now
