// Starter circuit for the Private Location Eligibility template.
// Coordinates should be scaled and shifted into positive integers before proving.

fn main(
    lat_offset: u64,
    lon_offset: u64,
    credential_secret: Field,
    min_lat_offset: pub u64,
    max_lat_offset: pub u64,
    min_lon_offset: pub u64,
    max_lon_offset: pub u64
) {
    assert(min_lat_offset <= max_lat_offset);
    assert(min_lon_offset <= max_lon_offset);
    assert(lat_offset >= min_lat_offset);
    assert(lat_offset <= max_lat_offset);
    assert(lon_offset >= min_lon_offset);
    assert(lon_offset <= max_lon_offset);

    // Keep the credential secret in-circuit so this starter mirrors an issued credential flow.
    assert(credential_secret != 0);
}
