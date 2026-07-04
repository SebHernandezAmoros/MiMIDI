import type { ExternalPluginRepository } from "../ports/ExternalPluginRepository"
import {
  deleteExternalPlugin,
  listExternalPluginIds,
  loadExternalPlugin,
  saveExternalPlugin,
} from "../../engine/plugins/externalPluginStorage"

export function createLegacyExternalPluginUseCaseDependencies() {
  return {
    externalPlugins: {
      delete: deleteExternalPlugin,
      listIds: listExternalPluginIds,
      load: loadExternalPlugin,
      save: saveExternalPlugin,
    } satisfies ExternalPluginRepository,
  }
}
