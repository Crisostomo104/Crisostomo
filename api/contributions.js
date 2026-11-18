const query = `
    query ContributionCalendar($from: DateTime!, $to: DateTime!) {
        viewer {
            contributionsCollection(from: $from, to: $to) {
                contributionCalendar {
                    totalContributions
                    weeks {
                        contributionDays {
                            date
                            weekday
                            contributionCount
                            color
                        }
                    }
                }
            }
        }
    }
`;

const escapeXml = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        return res.status(503).json({ error: 'GITHUB_TOKEN is not configured' });
    }

    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - 365);

    let response;
    try {
        response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Crisostomo-Portfolio',
            },
            body: JSON.stringify({
                query,
                variables: { from: from.toISOString(), to: to.toISOString() },
            }),
        });
    } catch (error) {
        console.error('GitHub GraphQL request failed.', error);
        return res.status(502).json({ error: 'GitHub contribution service is unavailable' });
    }

    if (!response.ok) {
        console.error(`GitHub GraphQL returned HTTP ${response.status}.`);
        return res.status(502).json({ error: 'GitHub contribution service rejected the request' });
    }

    let result;
    try {
        result = await response.json();
    } catch (error) {
        console.error('GitHub GraphQL returned invalid JSON.', error);
        return res.status(502).json({ error: 'GitHub returned an invalid response' });
    }

    if (!result || result.errors || !result.data?.viewer?.contributionsCollection?.contributionCalendar) {
        console.error('GitHub GraphQL did not return a contribution calendar.', result?.errors || []);
        return res.status(502).json({ error: 'GitHub did not return a contribution calendar' });
    }

    const calendar = result.data.viewer.contributionsCollection.contributionCalendar;
    const weeks = calendar.weeks;
    if (!Array.isArray(weeks) || weeks.length === 0) {
        return res.status(502).json({ error: 'GitHub returned an empty contribution calendar' });
    }

    const cell = 10;
    const gap = 2;
    const left = 27;
    const top = 20;
    const width = left + weeks.length * (cell + gap);
    const height = top + 7 * (cell + gap);
    const palette = ['#EEEEEE', '#D8F3DC', '#95D5B2', '#52B788', '#2D6A4F'];
    const monthLabels = [];
    let previousMonth = '';

    weeks.forEach((week, weekIndex) => {
        if (!Array.isArray(week.contributionDays) || week.contributionDays.length === 0) return;
        const firstDay = week.contributionDays[0];
        if (!firstDay || !/^\d{4}-\d{2}-\d{2}$/.test(firstDay.date)) return;
        const month = firstDay.date.slice(0, 7);
        if (month !== previousMonth) {
            previousMonth = month;
            const label = new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-US', {
                month: 'short',
                timeZone: 'UTC',
            });
            monthLabels.push(`<text x="${left + weekIndex * (cell + gap)}" y="12">${label}</text>`);
        }
    });

    const squares = [];
    weeks.forEach((week, weekIndex) => {
        if (!Array.isArray(week.contributionDays)) return;
        week.contributionDays.forEach(day => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date)) return;
            const weekday = Number(day.weekday);
            const count = Number(day.contributionCount);
            if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 ||
                !Number.isSafeInteger(count) || count < 0) return;

            const color = /^#[0-9a-f]{6}$/i.test(day.color) ? day.color : palette[0];
            const x = left + weekIndex * (cell + gap);
            const y = top + weekday * (cell + gap);
            const title = `${count} contribution${count === 1 ? '' : 's'} on ${day.date}`;
            squares.push(
                `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${color}">` +
                `<title>${escapeXml(title)}</title></rect>`
            );
        });
    });

    const weekdayLabels = [
        ['Mon', 1],
        ['Wed', 3],
        ['Fri', 5],
    ].map(([label, weekday]) => {
        const y = top + weekday * (cell + gap) + cell - 1;
        return `<text x="0" y="${y}">${label}</text>`;
    });

    const total = Number(calendar.totalContributions);
    if (!Number.isSafeInteger(total) || total < 0) {
        return res.status(502).json({ error: 'GitHub returned an invalid contribution total' });
    }

    const svg = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title">`,
        `<title id="title">${total} public and private GitHub contributions in the last year</title>`,
        '<style>text{fill:#667085;font:14px Arial,sans-serif}rect{shape-rendering:crispEdges}</style>',
        ...monthLabels,
        ...weekdayLabels,
        ...squares,
        '</svg>',
    ].join('');

    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=60');
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    return res.status(200).send(svg);
};
