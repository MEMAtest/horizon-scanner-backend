(function() {
  const registry = window.__WorkspaceModuleRegistry = window.__WorkspaceModuleRegistry || [];

  registry.push(function applyWorkspaceState(context) {
    const state = context.state;
    const constants = context.constants;

    function getAliasMap() {
      const aliasMap = window.__sectorAliasMap;
      return aliasMap && typeof aliasMap === 'object' ? aliasMap : {};
    }

    function setAliasMap(map) {
      if (map && typeof map === 'object') {
        window.__sectorAliasMap = map;
      }
    }

    function normalizeSector(value) {
      if (!value) return '';
      const raw = String(value).trim();
      if (!raw) return '';
      const key = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
      const alias = getAliasMap()[key];
      return alias || raw;
    }

    function setAvailableSectors(list) {
      const normalized = Array.isArray(list)
        ? Array.from(new Set(list.map(normalizeSector).filter(Boolean)))
        : [];

      state.availableSectors = normalized.length > 0
        ? normalized
        : constants.DEFAULT_SECTORS.slice();
      window.availableSectors = state.availableSectors;
    }

    function getAvailableSectors() {
      return state.availableSectors.length > 0
        ? state.availableSectors
        : constants.DEFAULT_SECTORS.slice();
    }

    function normalizeTopicArea(value) {
      return value == null ? '' : String(value).trim();
    }

    context.define('getAliasMap', getAliasMap);
    context.define('setAliasMap', setAliasMap);
    context.define('normalizeSector', normalizeSector);
    context.define('setAvailableSectors', setAvailableSectors);
    context.define('getAvailableSectors', getAvailableSectors);
    context.define('normalizeTopicArea', normalizeTopicArea);
  });
})();
