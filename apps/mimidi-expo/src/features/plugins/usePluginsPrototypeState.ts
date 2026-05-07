import { useMemo, useState } from 'react';

type PluginItem = {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  enabled: boolean;
};

const initialPlugins: PluginItem[] = [
  {
    id: 'MC',
    name: 'M Compressor',
    version: 'v1.0.0',
    description: 'Control de dinamica para tracks y buses.',
    category: 'Dynamics',
    enabled: true,
  },
  {
    id: 'MR',
    name: 'M Reverb',
    version: 'v1.2.3',
    description: 'Ambiente corto y largo para capas melodicas.',
    category: 'Reverb',
    enabled: true,
  },
  {
    id: 'MD',
    name: 'M Delay',
    version: 'v1.0.1',
    description: 'Eco sincronizado para riffs y frases.',
    category: 'Delay',
    enabled: false,
  },
  {
    id: 'MF',
    name: 'M Filter',
    version: 'v1.1.0',
    description: 'Filtro resonante para barridos y automatizacion.',
    category: 'Filter',
    enabled: true,
  },
  {
    id: 'CH',
    name: 'M Chorus',
    version: 'v1.0.0',
    description: 'Modulacion ligera para engrosar voces.',
    category: 'Modulation',
    enabled: false,
  },
];

export function usePluginsPrototypeState() {
  const [plugins, setPlugins] = useState(initialPlugins);
  const [selectedPluginId, setSelectedPluginId] = useState(initialPlugins[0].id);
  const [importCount, setImportCount] = useState(0);
  const [folderOpenCount, setFolderOpenCount] = useState(0);

  const selectedPlugin = useMemo(
    () => plugins.find((plugin) => plugin.id === selectedPluginId) ?? plugins[0],
    [plugins, selectedPluginId],
  );

  const enabledCount = useMemo(
    () => plugins.filter((plugin) => plugin.enabled).length,
    [plugins],
  );

  function togglePlugin(pluginId: string) {
    setPlugins((current) =>
      current.map((plugin) =>
        plugin.id === pluginId
          ? { ...plugin, enabled: !plugin.enabled }
          : plugin,
      ),
    );
  }

  function selectPlugin(pluginId: string) {
    setSelectedPluginId(pluginId);
  }

  function simulateImport() {
    setImportCount((current) => current + 1);
  }

  function simulateOpenFolder() {
    setFolderOpenCount((current) => current + 1);
  }

  return {
    enabledCount,
    folderOpenCount,
    importCount,
    plugins,
    selectedPlugin,
    selectedPluginId,
    selectPlugin,
    simulateImport,
    simulateOpenFolder,
    togglePlugin,
  };
}
