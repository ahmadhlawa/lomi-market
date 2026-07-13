# Known limitations

- SMS and push use development providers because no production credentials were supplied.
- Online card payment is intentionally disabled; COD is the active payment method.
- Driver location is status-based, not live GPS telemetry.
- Delivery-zone validation is city-based for the MVP rather than polygon/geofence based.
- Arabic core navigation/auth/customer content supports RTL preference, but some legacy commerce screen copy remains English pending final professional translation review.
- Legal copy is an operational summary and requires owner/legal approval.
- Expo's build-tool dependency tree reports a moderate `xcode`/`uuid` advisory with no SDK-safe fix; critical/high advisories were removed and the affected package is build tooling, not shipped application code.

