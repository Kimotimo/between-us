require('dotenv').config();

const express = require('express');
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg');

const app = express();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter })
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server Connect!');
});

app.post('/meetings', async (req, res) => {
    try {
        const { meetingName, meetingTime, capacity } = req.body;

        const newMeeting = await prisma.meeting.create({
            data: {
                meetingName : meetingName,
                meetingTime: new Date(meetingTime),
                capacity: capacity,
            }
        });

        res.status(201).json(newMeeting);
    }catch (error) {
        console.error(error);
        res.status(500).json({error: '모임 생성에 실패했어요.'})
    }
})

app.get('/meetings/:id', async (req, res) => {
    try {
        const meetingId = req.params.id;

        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
        });

        if (meeting === null) {
            res.status(404).send("모임을 찾을 수 없어요");
            return;
        }

        res.send(meeting);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "모임 조회에 실패했어요" });
    }
});

app.post('/meetings/:id/participants', async(req, res) => {
    try{
        const meetingId = req.params.id;
        const { guestName, transportType } = req.body;

        const participant = await prisma.participant.create({
            data: {
                meetingId: meetingId,
                guestName: guestName,
                transportType: transportType,
            }
        });
        res.status(201).json(participant);
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: "참여자 생성에 실패했습니다"});
    }
})

//카카오 지오코딩 api 호출코드
async function getCoordinates(address) {
    const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(address)}`,
        {
            headers: {
                Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}`,
            },
        }
    );
    const data = await response.json();

    if (data.documents.length === 0) {
        throw new Error("해당 주소를 찾을 수 없습니다");
    }

    const { x, y } = data.documents[0];
    return { latitude: parseFloat(y), longitude: parseFloat(x) };
}


app.post('/participants/:id/location', async(req, res) => {
    try{
        const participationId = req.params.id;
        const { startArea } = req.body;
        const { latitude, longitude } = await getCoordinates(startArea);

        const newLocation = await prisma.location.create({
            data: {
                participationId : participationId,
                startArea: startArea,
                latitude: latitude,
                longitude: longitude,
            }
        });

        res.status(201).json(newLocation);
    } catch(error){
        console.error(error);
        res.status(500).json({ error: "장소 생성중 오류가 발생했습니다."})
    }
})

app.get('/participants/:id/location', async(req, res) => {
    try{
        const participantId = req.params.id;

        const location = await prisma.location.findUnique({
            where: { participationId: participantId }
        })

        res.send(location);
    } catch(error){
        console.error(error);
        res.status(500).json({ error: "장소 조회에 실패했습니다"});
    }
})

app.get('/meetings/:id/midpoint', async(req, res) => {
    try{
        const meetingId = req.params.id;
        const participants = await prisma.participant.findMany({
            where: { meetingId: meetingId },
            include: {location: true },
        });

        const locations = participants
            .filter(p => p.location !== null)
            .map(p => p.location);

        if (locations.length === 0){
            res.status(400).json({ error: "출발지를 입력한 참가자가 없습니다" });
                return;
        }

        const avgLatitude = locations.reduce((sum, loc) => sum + loc.latitude, 0)/ locations.length;
        const avgLongitude = locations.reduce((sum,loc) => sum + loc.longitude, 0)/ locations.length;

        res.json({
            midpoint: { latitude: avgLatitude, longitude: avgLongitude },
            participantCount: locations.length,
        });
    } catch(error){
        console.error(error)
        res.status(500).json({ error: "중간지점을 구하는 과정에서 오류가 발생했습니다."})
    }
});

app.get('/search/address', async (req, res) => {
    try {
        const { query } = req.query;

        const response = await fetch(
            `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`,
            {
                headers: { Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}` },
            }
        );
        const data = await response.json();

        const results = data.documents.map(doc => ({
            name: doc.place_name,
            address: doc.address_name,
            latitude: parseFloat(doc.y),
            longitude: parseFloat(doc.x),
        }));

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "주소 검색에 실패했습니다" });
    }
});

app.listen(port, () => {
    console.log('server Connecting');
});