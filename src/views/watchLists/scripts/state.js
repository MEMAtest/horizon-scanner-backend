function getWatchListStateScript({ serializedWatchLists, serializedStats, serializedAuthorities, serializedSectors }) {
  return `<script>
      window.watchListState = {
        watchLists: ${serializedWatchLists},
        stats: ${serializedStats},
        currentWatchListId: null,
        currentLinkType: null,
        currentUpdateId: null,
        pendingUnlinkMatchId: null,
        dossiers: [],
        dossiersLoaded: false,
        tags: {
          keywords: [],
          authorities: [],
          sectors: []
        },
        dropdownOptions: {
          authorities: ${serializedAuthorities},
          sectors: ${serializedSectors}
        }
      };
    </script>`
}

module.exports = { getWatchListStateScript }
