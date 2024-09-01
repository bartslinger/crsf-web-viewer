import { crc8DvbS2 } from '$lib/crc';

export type CrsfRadioMessage = {
	type: 'RADIO';
	update_interval: number;
	offset: number;
};

export type CrsfBatteryMessage = {
	type: 'BATTERY';
	voltage: number;
	current: number;
	capacity: number;
	remaining: number;
};

export class CrsfFramingTransformer {
	buffer: number[];

	constructor() {
		// A container for holding stream data until a new line.
		this.buffer = [];
	}

	transform(chunk: Uint8Array, controller) {
		this.buffer = [...this.buffer, ...chunk];

		// delete bytes until the first value in buffer is 234
		while (this.buffer.length > 0 && this.buffer[0] !== 0xea) {
			this.buffer.shift();
		}
		if (this.buffer.length === 0) {
			return;
		}

		// find all positions of 0xea in the buffer
		const frameStartIndices = [];
		for (let i = 0; i < this.buffer.length; i++) {
			if (this.buffer[i] === 0xea) {
				frameStartIndices.push(i);
			}
		}

		let parsedUntil = 0;
		for (const frameStartIndex of frameStartIndices) {
			if (frameStartIndex < parsedUntil) {
				continue;
			}
			if (this.buffer.length < frameStartIndex + 3) {
				// should at least have start byte, frame length, message type and crc
				break;
			}
			const frameLength = this.buffer[frameStartIndex + 1] + 2;
			if (this.buffer.length < frameStartIndex + frameLength) {
				// maybe the message is not complete yet
				// or maybe the length byte is corrupted, there might be a next 0xea
				continue;
			}
			const slice = this.buffer.slice(frameStartIndex, frameStartIndex + frameLength);
			// console.log(slice);
			const crc_relevant_slice = slice.slice(2, slice.length - 1);
			// console.log(crc_relevant_slice);
			const calculated_crc = crc8DvbS2(crc_relevant_slice);
			const actual_crc = slice[frameLength - 1];
			if (calculated_crc === actual_crc) {
				controller.enqueue(slice);
				parsedUntil = frameStartIndex + frameLength;
			}
		}

		this.buffer = this.buffer.slice(parsedUntil);
	}
}

const GPS_ID = 0x02;
const BATTERY_ID = 0x08;
const RADIO_ID = 0x3a;

export class CrsfMessageTransformer {
	constructor() {}

	transform(bytes: number[], controller: any) {
		const byte_array = new Uint8Array(bytes);
		const view = new DataView(byte_array.buffer);
		const message_type = view.getUint8(2);
		if (message_type === RADIO_ID) {
			if (view.getUint8(3) !== 0xea && view.getUint8(5) !== 0x10) {
				console.error('reject invalid radio_id message');
				return;
			}
			const update_interval = view.getUint32(6, false) / 10;
			const offset = view.getInt32(10, false) / 10;
			const message: CrsfRadioMessage = {
				type: 'RADIO',
				update_interval,
				offset
			};
			controller.enqueue(message);
		} else if (message_type === BATTERY_ID) {
			const voltage = view.getUint16(3, false) / 10;
			const current = view.getInt16(5, false) / 10;
			const capacity = view.getUint16(7, false) * 256 + view.getUint8(9);
			const remaining = view.getUint8(10);
			const message: CrsfBatteryMessage = {
				type: 'BATTERY',
				voltage,
				current,
				capacity,
				remaining
			};
			controller.enqueue(message);
		}
	}
}
