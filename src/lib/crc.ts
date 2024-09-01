export function crc8DvbS2(data: number[]) {
	const polynomial = 0xd5;
	let crc = 0x00;

	for (const byte of data) {
		crc ^= byte;
		for (let i = 0; i < 8; i++) {
			if (crc & 0x80) {
				crc = (crc << 1) ^ polynomial;
			} else {
				crc <<= 1;
			}
			crc &= 0xff;
		}
	}

	return crc;
}
