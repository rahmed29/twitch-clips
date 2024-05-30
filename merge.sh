
ffmpeg -i ./downloads/input2.mp4 -i ./template.mp4 -filter_complex "[1:v]chromakey=0x00D700:0.1:0.2[green];[0:v][green]overlay[outv]" -map "[outv]" -map "0:a" -c:v libx264 -c:a aac -strict experimental ./downloads/input2_sub.mp4

rm ./downloads/input2.mp4

mv ./downloads/input2_sub.mp4 ./downloads/input2.mp4

ffmpeg -i ./downloads/input1.mp4 -i ./downloads/input2.mp4 -i ./downloads/input3.mp4 -i ./downloads/input4.mp4 -i ./downloads/input5.mp4 -i ./downloads/input6.mp4 -i ./downloads/input7.mp4 -i ./downloads/input8.mp4 -i ./downloads/input9.mp4 -i ./downloads/input10.mp4 -i ./downloads/input11.mp4 -i ./downloads/input12.mp4 -i ./downloads/input13.mp4 -i ./downloads/input14.mp4 -i ./downloads/input15.mp4 -i ./downloads/input16.mp4 -i ./downloads/input17.mp4 -i ./downloads/input18.mp4 -filter_complex "[0:v]scale=1920x1080[v0];[1:v]scale=1920x1080[v1];[2:v]scale=1920x1080[v2];[3:v]scale=1920x1080[v3];[4:v]scale=1920x1080[v4];[5:v]scale=1920x1080[v5];[6:v]scale=1920x1080[v6];[7:v]scale=1920x1080[v7];[8:v]scale=1920x1080[v8];[9:v]scale=1920x1080[v9];[10:v]scale=1920x1080[v10];[11:v]scale=1920x1080[v11];[12:v]scale=1920x1080[v12];[13:v]scale=1920x1080[v13];[14:v]scale=1920x1080[v14];[15:v]scale=1920x1080[v15];[16:v]scale=1920x1080[v16];[17:v]scale=1920x1080[v17];[v0][0:a][v1][1:a][v2][2:a][v3][3:a][v4][4:a][v5][5:a][v6][6:a][v7][7:a][v8][8:a][v9][9:a][v10][10:a][v11][11:a][v12][12:a][v13][13:a][v14][14:a][v15][15:a][v16][16:a][v17][17:a] concat=n=18:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v libx264 -c:a aac -vsync 2 -strict experimental ./master/1717097949858.mp4

rm -rf ./downloads