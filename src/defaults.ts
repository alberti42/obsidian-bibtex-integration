// defaults.ts

import {BibtexIntegrationSettings, AuthorOptions} from 'types'

export const AuthorOptionsDefault: AuthorOptions = {
    shortList: false,
    onlyLastName: false,
}

export const DEFAULT_SETTINGS: BibtexIntegrationSettings = {
    bibtex_filepath: '',
    import_delay_ms: 1000,
    debug_parser: false,
    widthRecentList: 1000,
    pdf_folder: '/',
}
