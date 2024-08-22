// defaults.ts

import {BibtexIntegrationSettings, AuthorOptions, JournalReferenceOptions, HighlightType} from 'types'

export const DEFAULT_SETTINGS: BibtexIntegrationSettings = {
    bibtex_filepath: '',
    import_delay_ms: 1000,
    debug_parser: false,
    widthRecentList: 1000,
    pdf_folder: '/',
    organize_by_years: true,
}

export const AuthorOptionsDefault: AuthorOptions = {
    shortList: false,
    onlyLastName: false,
}

export const JournalReferenceOptionDefault: JournalReferenceOptions = {
    includingYear: true,
    highlightVolume: HighlightType.None,
}
