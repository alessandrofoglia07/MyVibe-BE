/**
 * Limits the number of consecutive new lines in a string to 3
 * @param text Text to limit new lines in
 * @returns Text with new lines limited to 3 consecutive new lines
 */
export default function limitNewLines(text) {
    const maxConsecutiveNewLines = 3;
    const regex = new RegExp(`(\\n\\s*){${maxConsecutiveNewLines + 1},}`, 'g');
    return text.replace(regex, '\n'.repeat(maxConsecutiveNewLines));
}
;
