const laneDefinitions = {
  act_now: {
    key: 'act_now',
    title: 'Act Now (<=14 days)',
    description: 'Immediate exposures where action inside two weeks prevents regulatory escalation.'
  },
  prepare_next: {
    key: 'prepare_next',
    title: 'Prepare Next (15-45 days)',
    description: 'Signals that need ownership in the next month to stay ahead of anticipated moves.'
  },
  plan_horizon: {
    key: 'plan_horizon',
    title: 'Plan Horizon (45-90 days)',
    description: 'Themes to shape the strategic roadmap and stakeholder planning window.'
  }
}

module.exports = { laneDefinitions }
