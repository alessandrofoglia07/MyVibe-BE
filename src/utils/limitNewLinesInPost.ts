export default function limitNewLines(text: string): string {
    const maxConsecutiveNewLines = 3;
    const regex = new RegExp(`(\\n\\s*){${maxConsecutiveNewLines + 1},}`, 'g');
    return text.replace(regex, '\n'.repeat(maxConsecutiveNewLines));
};