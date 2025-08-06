# Page snapshot

```yaml
- banner:
  - heading "Price Tracker" [level=1]
  - navigation:
    - button:
      - img
- main:
  - heading "商品を検索" [level=2]
  - 'textbox "商品名を入力（例: 牛乳、パン）"'
  - button "検索":
    - img
    - text: 検索
  - img
  - heading "現在地周辺の店舗" [level=2]
  - region "Map"
  - button "Map marker" [expanded]:
    - img
  - button "Zoom in"
  - button "Zoom out"
  - button "Reset bearing to north"
  - button "Find my location"
  - link "Mapbox logo":
    - /url: https://www.mapbox.com/
  - list:
    - link "Mapbox":
      - /url: https://www.mapbox.com/about/maps/
      - text: © Mapbox
    - link "OpenStreetMap":
      - /url: https://www.openstreetmap.org/copyright/
      - text: © OpenStreetMap
    - link "Map feedback":
      - /url: https://apps.mapbox.com/feedback/?owner=mapbox&id=streets-v12&access_token=pk.eyJ1IjoibWhjcDAwMDEiLCJhIjoiY20yOTY5ZmN2MDI0MDJpcHpwenBud3B1aCJ9.CvqqdEo9XuRUhnlqO1vpMA#/139.6503/35.6762/14
      - text: Improve this map
  - paragraph: 現在地
  - heading "価格を投稿" [level=2]
  - paragraph: 店舗を選択して価格を投稿してください
```