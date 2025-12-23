# TODO: Adjust Temperature Slider Behavior

## Completed Tasks
- [x] Normalize temperature scaling from 0-20 to 0-100
- [x] Make lifetime variable instead of constant
- [x] Adjust temperature effects:
  - Low (<=33): Flat, slow drifting, small lifetime (1.5s)
  - Medium (34-66): Rising plume with curl, normal lifetime (3.0s)
  - High (>66): Tall coherent column, longer lifetime (4.0s)
- [x] Add curl effect (rotation) for medium temperature
- [x] Set all sliders to 50% default values
- [x] Adjust smoke for medium-sized plume slowly rising by default

## Followup Steps
- [ ] Test the smoke behavior with different temperature values
- [ ] Verify no conflicts with gas density or other parameters
- [ ] Adjust rotation speed or lifetime values if needed based on visual feedback
